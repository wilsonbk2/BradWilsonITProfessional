import os
from pathlib import Path
import base64

from github import Github


# ============================================================
# CONFIGURATION
# ============================================================

EXCLUDED_REPOSITORIES = {
    "wilsonbk2/BradWilsonITProfessional",
}

ALLOWED_EXTENSIONS = {
    ".py", ".js", ".jsx", ".ts", ".tsx", ".html", ".css", ".sql",
    ".json", ".xml", ".yaml", ".yml", ".md", ".txt", ".ps1", ".bat",
    ".sh", ".cs", ".java", ".cpp", ".c", ".h", ".hpp", ".vb", ".vbs",
    ".vba", ".sol", ".fx", ".cls", ".bas",
}

IGNORED_NAMES = {
    ".git",
    ".github",
    "node_modules",
    "__pycache__",
    ".venv",
    "venv",
    "dist",
    "build",
}


# Maximum source size retrieved for an individual file.
# This prevents one enormous file from consuming the entire prompt.
MAX_FILE_SIZE = 500_000


github = Github(os.getenv("GITHUB_TOKEN"))


# ============================================================
# GITHUB HELPERS
# ============================================================

def get_repository(repository_name):
    if repository_name in EXCLUDED_REPOSITORIES:
        return None

    return github.get_repo(repository_name)


def should_include_file(path):
    path_object = Path(path)

    for part in path_object.parts:
        if part in IGNORED_NAMES:
            return False

    if path_object.suffix.lower() not in ALLOWED_EXTENSIONS:
        return False

    return True


# ============================================================
# BUILD LIGHTWEIGHT FILE INDEX
# ============================================================

def get_repository_file_index(repository_name, branch=None):
    """
    Build a lightweight index of repository files.

    IMPORTANT:
    This does NOT download the contents of every file.

    We only store metadata needed to determine which files
    are relevant to a user's question later.
    """

    repo = get_repository(repository_name)

    if repo is None:
        return []

    if branch is None:
        branch = repo.default_branch

    print()
    print(f"Indexing repository: {repository_name}")
    print(f"Branch: {branch}")

    tree = repo.get_git_tree(
        branch,
        recursive=True
    )

    files = []

    for item in tree.tree:

        if item.type != "blob":
            continue

        if not should_include_file(item.path):
            continue

        path_object = Path(item.path)

        files.append({
            "repository": repository_name,
            "branch": branch,
            "path": item.path,
            "extension": path_object.suffix.lower(),
            "sha": item.sha,
            "size": getattr(item, "size", 0),
        })

    print(
        f"  Indexed {len(files)} files "
        f"from {repository_name}"
    )

    return files


def load_github_knowledge():
    """
    Build the GitHub knowledge index.

    This intentionally does NOT download source code.

    The resulting structure is small enough to keep in memory
    and can scale to a much larger GitHub archive.
    """

    knowledge = []

    print()
    print("=" * 80)
    print("BUILDING GITHUB FILE INDEX")
    print("=" * 80)

    user = github.get_user()

    repositories = user.get_repos(type="all")

    for repo in repositories:

        repository_name = repo.full_name

        if repository_name in EXCLUDED_REPOSITORIES:
            print(
                f"\nSkipping excluded repository: "
                f"{repository_name}"
            )
            continue

        branch = repo.default_branch

        files = get_repository_file_index(
            repository_name,
            branch
        )

        knowledge.extend(files)

    print()
    print("=" * 80)
    print(
        f"GITHUB INDEX COMPLETE: "
        f"{len(knowledge)} files"
    )
    print("=" * 80)

    return knowledge


# ============================================================
# SEARCH FILE INDEX
# ============================================================

def search_github_knowledge(
    github_knowledge,
    search_terms,
    max_results=5
):
    """
    Search the lightweight GitHub file index.

    No source code is downloaded during this operation.

    Relevance is determined from:
        - filename
        - directory path
        - repository name
        - file extension
    """

    if not search_terms:
        return []

    terms = []

    for term in search_terms:

        term = term.lower().strip()

        if term and term not in terms:
            terms.append(term)

    results = []

    for file in github_knowledge:

        repository = file["repository"].lower()
        path = file["path"].lower()
        extension = file["extension"].lower()

        filename = Path(path).name.lower()

        score = 0

        for term in terms:

            # Strongest match: filename
            if term in filename:
                score += 25

            # Strong match: path
            if term in path:
                score += 15

            # Repository match
            if term in repository:
                score += 10

            # Extension match
            if term == extension:
                score += 5

        if score == 0:
            continue

        results.append({
            "repository": file["repository"],
            "branch": file["branch"],
            "path": file["path"],
            "extension": file["extension"],
            "sha": file["sha"],
            "size": file["size"],
            "score": score,
        })

    results.sort(
        key=lambda item: item["score"],
        reverse=True
    )

    return results[:max_results]


# ============================================================
# RETRIEVE ACTUAL FILE CONTENT
# ============================================================

def load_file_content(file):
    """
    Retrieve the actual source code for a file after it has
    been selected as relevant.

    GitHub remains the source of truth.
    """

    try:

        repo = get_repository(
            file["repository"]
        )

        if repo is None:
            return None

        # Protect the backend from extremely large files.
        if file["size"] and file["size"] > MAX_FILE_SIZE:

            print(
                f"Skipping oversized file: "
                f"{file['path']} "
                f"({file['size']} bytes)"
            )

            return None

        blob = repo.get_git_blob(
            file["sha"]
        )

        decoded_bytes = base64.b64decode(
            blob.content
        )

        content = decoded_bytes.decode(
            "utf-8",
            errors="ignore"
        )

        return {
            "repository": file["repository"],
            "branch": file["branch"],
            "path": file["path"],
            "content": content,
            "score": file["score"],
        }

    except Exception as error:

        print(
            f"Could not retrieve "
            f"{file['repository']}/"
            f"{file['path']}: "
            f"{error}"
        )

        return None


def get_relevant_github_files(
    github_knowledge,
    search_terms,
    max_results=5
):
    """
    Search the lightweight index and then retrieve the actual
    contents of only the most relevant files.
    """

    matching_files = search_github_knowledge(
        github_knowledge,
        search_terms,
        max_results=max_results
    )

    relevant_files = []

    for file in matching_files:

        content = load_file_content(file)

        if content is None:
            continue

        relevant_files.append(content)

    return relevant_files


# ============================================================
# LOCAL TEST
# ============================================================

if __name__ == "__main__":

    knowledge = load_github_knowledge()

    print()
    print(
        f"Total indexed files: "
        f"{len(knowledge)}"
    )

    test_terms = [
        "database",
        "sql",
        "employee",
    ]

    results = get_relevant_github_files(
        knowledge,
        test_terms,
        max_results=5
    )

    print()
    print("Relevant files:")

    for result in results:

        print(
            f"- {result['repository']}/"
            f"{result['path']}"
        )
