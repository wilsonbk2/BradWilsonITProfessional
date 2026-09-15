# from github import Github
# from pathlib import Path
# import base64


# # ============================================================
# # SETTINGS
# # ============================================================

# # Repositories that should NOT be included in AI knowledge.
# EXCLUDED_REPOSITORIES = {
#     "wilsonbk2/wilsonbk2",
# }


# # File extensions that are useful to the AI.
# ALLOWED_EXTENSIONS = {
#     ".py",
#     ".js",
#     ".jsx",
#     ".ts",
#     ".tsx",
#     ".html",
#     ".css",
#     ".sql",
#     ".json",
#     ".xml",
#     ".yaml",
#     ".yml",
#     ".md",
#     ".txt",
#     ".ps1",
#     ".bat",
#     ".sh",
#     ".cs",
#     ".java",
#     ".cpp",
#     ".c",
#     ".h",
#     ".hpp",
#     ".vb",
#     ".vbs",
#     ".vba",
#     ".sol",
# }


# # Files/directories we don't need.
# IGNORED_NAMES = {
#     ".git",
#     ".github",
#     "node_modules",
#     "__pycache__",
#     ".venv",
#     "venv",
#     "dist",
#     "build",
# }


# # ============================================================
# # GITHUB CONNECTION
# # ============================================================

# github = Github()


# # ============================================================
# # GET REPOSITORY
# # ============================================================

# def get_repository(repository_name):

#     if repository_name in EXCLUDED_REPOSITORIES:
#         return None

#     return github.get_repo(repository_name)


# # ============================================================
# # SHOULD INCLUDE FILE?
# # ============================================================

# def should_include_file(path):

#     path_object = Path(path)

#     # Ignore files inside unwanted directories.
#     for part in path_object.parts:

#         if part in IGNORED_NAMES:
#             return False

#     # Only include useful source/text files.
#     if path_object.suffix.lower() not in ALLOWED_EXTENSIONS:
#         return False

#     return True


# # ============================================================
# # GET REPOSITORY FILES
# # ============================================================

# def get_repository_files(repository_name, branch=None):

#     repo = get_repository(repository_name)

#     if repo is None:
#         return []

#     if branch is None:
#         branch = repo.default_branch

#     print()
#     print(f"Retrieving repository: {repository_name}")
#     print(f"Branch: {branch}")

#     # Get the complete repository tree.
#     tree = repo.get_git_tree(
#         branch,
#         recursive=True
#     )

#     files = []

#     for item in tree.tree:

#         # Only process actual files.
#         if item.type != "blob":
#             continue

#         if not should_include_file(item.path):
#             continue

#         try:

#             blob = repo.get_git_blob(item.sha)

#             # GitHub returns the blob content as Base64.
#             decoded_bytes = base64.b64decode(
#                 blob.content
#             )

#             content = decoded_bytes.decode(
#                 "utf-8",
#                 errors="ignore"
#             )

#             files.append({
#                 "repository": repository_name,
#                 "branch": branch,
#                 "path": item.path,
#                 "content": content
#             })

#             print(f"  Loaded: {item.path}")

#         except Exception as error:

#             print(
#                 f"  Could not load "
#                 f"{item.path}: {error}"
#             )

#     return files


# # ============================================================
# # GET ALL GITHUB PROJECTS
# # ============================================================

# def load_github_knowledge(github_projects):

#     knowledge = []

#     # Prevent duplicate repositories.
#     processed_repositories = set()

#     for project in github_projects:

#         repository = project.get("repository")
#         branch = project.get("branch")

#         if not repository:
#             continue

#         if repository in EXCLUDED_REPOSITORIES:

#             print(
#                 f"\nSkipping excluded repository: "
#                 f"{repository}"
#             )

#             continue

#         if repository in processed_repositories:
#             continue

#         processed_repositories.add(repository)

#         files = get_repository_files(
#             repository,
#             branch
#         )

#         knowledge.extend(files)

#     return knowledge


# # ============================================================
# # TEST
# # ============================================================

# if __name__ == "__main__":

#     from portfolio_knowledge import load_portfolio_knowledge

#     portfolio = load_portfolio_knowledge()

#     github_projects = []

#     for page in portfolio:

#         for project in page["github_projects"]:

#             if project not in github_projects:
#                 github_projects.append(project)

#     print()
#     print("=" * 80)
#     print("DISCOVERED GITHUB REPOSITORIES")
#     print("=" * 80)

#     for project in github_projects:

#         print(
#             f"{project['repository']} "
#             f"({project['branch']})"
#         )

#     github_knowledge = load_github_knowledge(
#         github_projects
#     )

#     print()
#     print("=" * 80)
#     print("GITHUB KNOWLEDGE SUMMARY")
#     print("=" * 80)

#     repositories = set(
#         file["repository"]
#         for file in github_knowledge
#     )

#     print(
#         f"Repositories found: "
#         f"{len(repositories)}"
#     )

#     print(
#         f"Files loaded: "
#         f"{len(github_knowledge)}"
#     )

#     for file in github_knowledge:

#         print()
#         print("-" * 80)
#         print(
#             f"Repository: {file['repository']}"
#         )
#         print(
#             f"File: {file['path']}"
#         )
#         print("-" * 80)

#         print(
#             file["content"]
#         )




















import os
from github import Github
from pathlib import Path
import base64


# ============================================================
# SETTINGS
# ============================================================

EXCLUDED_REPOSITORIES = {
    "wilsonbk2/wilsonbk2",
}


ALLOWED_EXTENSIONS = {
    ".py",
    ".js",
    ".jsx",
    ".ts",
    ".tsx",
    ".html",
    ".css",
    ".sql",
    ".json",
    ".xml",
    ".yaml",
    ".yml",
    ".md",
    ".txt",
    ".ps1",
    ".bat",
    ".sh",
    ".cs",
    ".java",
    ".cpp",
    ".c",
    ".h",
    ".hpp",
    ".vb",
    ".vbs",
    ".vba",
    ".sol",
    ".fx",
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


# ============================================================
# GITHUB CONNECTION
# ============================================================

github = Github(
    os.getenv("GITHUB_TOKEN")
)


# ============================================================
# GET REPOSITORY
# ============================================================

def get_repository(repository_name):

    if repository_name in EXCLUDED_REPOSITORIES:
        return None

    return github.get_repo(repository_name)


# ============================================================
# SHOULD INCLUDE FILE?
# ============================================================

def should_include_file(path):

    path_object = Path(path)

    for part in path_object.parts:

        if part in IGNORED_NAMES:
            return False

    if path_object.suffix.lower() not in ALLOWED_EXTENSIONS:
        return False

    return True


# ============================================================
# GET REPOSITORY FILES
# ============================================================

def get_repository_files(repository_name, branch=None):

    repo = get_repository(repository_name)

    if repo is None:
        return []

    if branch is None:
        branch = repo.default_branch

    print()
    print(f"Retrieving repository: {repository_name}")
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

        try:

            blob = repo.get_git_blob(item.sha)

            decoded_bytes = base64.b64decode(
                blob.content
            )

            content = decoded_bytes.decode(
                "utf-8",
                errors="ignore"
            )

            files.append({
                "repository": repository_name,
                "branch": branch,
                "path": item.path,
                "content": content
            })

            print(f"  Loaded: {item.path}")

        except Exception as error:

            print(
                f"  Could not load "
                f"{item.path}: {error}"
            )

    return files


# ============================================================
# LOAD ALL GITHUB KNOWLEDGE
# ============================================================

def load_github_knowledge(github_projects):

    knowledge = []

    processed_repositories = set()

    for project in github_projects:

        repository = project.get("repository")
        branch = project.get("branch")

        if not repository:
            continue

        if repository in EXCLUDED_REPOSITORIES:

            print(
                f"\nSkipping excluded repository: "
                f"{repository}"
            )

            continue

        if repository in processed_repositories:
            continue

        processed_repositories.add(repository)

        files = get_repository_files(
            repository,
            branch
        )

        knowledge.extend(files)

    return knowledge


# ============================================================
# SEARCH GITHUB KNOWLEDGE
# ============================================================

def search_github_knowledge(
    github_knowledge,
    search_terms,
    max_results=8
):
    """
    Search loaded GitHub source code for relevant files.

    search_terms should be a list of words or phrases.
    """

    if not search_terms:
        return []

    # Normalize search terms.
    terms = []

    for term in search_terms:

        term = term.lower().strip()

        if term and term not in terms:
            terms.append(term)

    results = []

    for file in github_knowledge:

        path = file["path"].lower()
        content = file["content"].lower()

        score = 0

        # Filename matches are highly useful.
        for term in terms:

            if term in path:
                score += 10

        # Count occurrences inside the actual code.
        for term in terms:

            score += content.count(term)

        if score == 0:
            continue

        results.append({
            "repository": file["repository"],
            "branch": file["branch"],
            "path": file["path"],
            "content": file["content"],
            "score": score
        })

    # Highest relevance first.
    results.sort(
        key=lambda item: item["score"],
        reverse=True
    )

    return results[:max_results]


# ============================================================
# TEST
# ============================================================

if __name__ == "__main__":

    from portfolio_knowledge import load_portfolio_knowledge

    portfolio = load_portfolio_knowledge()

    github_projects = []

    for page in portfolio:

        for project in page["github_projects"]:

            if project not in github_projects:
                github_projects.append(project)

    print()
    print("=" * 80)
    print("DISCOVERED GITHUB REPOSITORIES")
    print("=" * 80)

    for project in github_projects:

        print(
            f"{project['repository']} "
            f"({project['branch']})"
        )

    github_knowledge = load_github_knowledge(
        github_projects
    )

    print()
    print("=" * 80)
    print("GITHUB KNOWLEDGE SUMMARY")
    print("=" * 80)

    repositories = set(
        file["repository"]
        for file in github_knowledge
    )

    print(
        f"Repositories found: "
        f"{len(repositories)}"
    )

    print(
        f"Files loaded: "
        f"{len(github_knowledge)}"
    )

    # --------------------------------------------------------
    # TEST SEARCH
    # --------------------------------------------------------

    print()
    print("=" * 80)
    print("TESTING CODE SEARCH")
    print("=" * 80)

    search_terms = [
        "database",
        "sql",
        "python"
    ]

    results = search_github_knowledge(
        github_knowledge,
        search_terms
    )

    print()
    print(
        f"Search terms: {search_terms}"
    )

    print(
        f"Relevant files found: {len(results)}"
    )

    for result in results:

        print()
        print("-" * 80)

        print(
            f"Score: {result['score']}"
        )

        print(
            f"Repository: "
            f"{result['repository']}"
        )

        print(
            f"File: "
            f"{result['path']}"
        )

        print("-" * 80)

        # Only show the beginning during testing.
        print(
            result["content"][:500]
        )
