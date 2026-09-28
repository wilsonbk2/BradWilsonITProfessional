```python
import os
from pathlib import Path
import base64
import re

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
    ".vba", ".sol", ".fx",
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


# Maximum source size retrieved for one file.
MAX_FILE_SIZE = 500_000


github = Github(os.getenv("GITHUB_TOKEN"))


# ============================================================
# TECHNICAL CONCEPTS
# ============================================================
#
# These aliases help connect natural-language questions to
# technical terms that may appear in repository/file names.
#
# This is intentionally lightweight. It does not require an AI
# call or external vector database.
# ============================================================

CONCEPT_ALIASES = {

    "database": {
        "database",
        "databases",
        "db",
        "sql",
        "schema",
        "table",
        "tables",
        "query",
        "queries",
        "relational",
        "data",
        "datastore",
        "backend",
    },

    "sql": {
        "sql",
        "query",
        "queries",
        "stored",
        "procedure",
        "procedures",
        "join",
        "joins",
        "select",
        "insert",
        "update",
        "delete",
        "cte",
        "database",
    },

    "automation": {
        "automation",
        "automated",
        "automation-webscraping",
        "selenium",
        "scraping",
        "webscraping",
        "workflow",
        "workflows",
        "bot",
        "script",
        "scripts",
    },

    "python": {
        "python",
        "py",
        "fastapi",
        "flask",
        "selenium",
        "pandas",
        "automation",
        "script",
        "scripts",
    },

    "powerbi": {
        "powerbi",
        "power",
        "bi",
        "dashboard",
        "dashboards",
        "report",
        "reports",
        "visualization",
        "visualizations",
        "analytics",
    },

    "access": {
        "access",
        "vba",
        "visual",
        "basic",
        "macro",
        "macros",
        "form",
        "forms",
        "query",
        "queries",
        "database",
    },

    "enterprise": {
        "enterprise",
        "qapi",
        "database",
        "system",
        "systems",
        "architecture",
        "integration",
        "application",
        "applications",
    },

    "web": {
        "web",
        "website",
        "html",
        "css",
        "javascript",
        "js",
        "frontend",
        "backend",
        "api",
        "fastapi",
        "react",
    },

    "api": {
        "api",
        "rest",
        "endpoint",
        "endpoints",
        "fastapi",
        "http",
        "json",
        "request",
        "response",
    },

    "software": {
        "software",
        "application",
        "applications",
        "programming",
        "code",
        "development",
        "engineering",
        "system",
        "systems",
    },

    "data": {
        "data",
        "database",
        "sql",
        "analytics",
        "reporting",
        "report",
        "records",
        "dataset",
        "datasets",
        "etl",
        "pipeline",
    },

    "reporting": {
        "report",
        "reports",
        "reporting",
        "dashboard",
        "dashboards",
        "analytics",
        "powerbi",
        "sql",
    },

    "security": {
        "security",
        "authentication",
        "authorization",
        "permissions",
        "token",
        "tokens",
        "encryption",
        "identity",
        "oauth",
    },

    "testing": {
        "test",
        "tests",
        "testing",
        "unit",
        "integration",
        "uat",
        "validation",
        "qa",
        "quality",
    },

    "quality": {
        "quality",
        "qapi",
        "qa",
        "validation",
        "compliance",
        "audit",
        "testing",
    },

    "compliance": {
        "compliance",
        "regulatory",
        "regulation",
        "audit",
        "auditing",
        "policy",
        "policies",
        "quality",
        "qapi",
    },

    "github": {
        "github",
        "repository",
        "repo",
        "git",
        "branch",
        "commit",
    },

    "frontend": {
        "frontend",
        "front",
        "html",
        "css",
        "javascript",
        "js",
        "jsx",
        "tsx",
        "react",
        "ui",
        "interface",
    },

    "backend": {
        "backend",
        "server",
        "api",
        "fastapi",
        "python",
        "database",
        "sql",
    },

    "cloud": {
        "cloud",
        "azure",
        "aws",
        "vercel",
        "deployment",
        "deploy",
        "serverless",
    },
}


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
# TEXT / TOKEN HELPERS
# ============================================================

def tokenize_text(text):

    if not text:
        return []

    text = text.lower()

    # Convert separators into spaces.
    text = re.sub(
        r"[_\-/\\\.]+",
        " ",
        text
    )

    # Split camelCase / PascalCase.
    text = re.sub(
        r"([a-z])([A-Z])",
        r"\1 \2",
        text
    )

    words = re.findall(
        r"[a-z0-9]+",
        text
    )

    return words


def build_concepts(tokens):

    token_set = set(tokens)

    concepts = set()

    for concept, aliases in CONCEPT_ALIASES.items():

        if token_set.intersection(aliases):
            concepts.add(concept)

    return sorted(concepts)


# ============================================================
# BUILD LIGHTWEIGHT FILE INDEX
# ============================================================

def get_repository_file_index(
    repository_name,
    branch=None
):

    repo = get_repository(repository_name)

    if repo is None:
        return []

    if branch is None:
        branch = repo.default_branch

    print()
    print(
        f"Indexing repository: "
        f"{repository_name}"
    )

    print(
        f"Branch: {branch}"
    )

    tree = repo.get_git_tree(
        branch,
        recursive=True
    )

    files = []

    # Repository itself becomes searchable.
    repository_tokens = tokenize_text(
        repository_name
    )

    repository_concepts = build_concepts(
        repository_tokens
    )

    for item in tree.tree:

        if item.type != "blob":
            continue

        if not should_include_file(item.path):
            continue

        path_object = Path(item.path)

        filename_tokens = tokenize_text(
            path_object.name
        )

        path_tokens = tokenize_text(
            item.path
        )

        all_tokens = (
            repository_tokens
            + path_tokens
            + filename_tokens
        )

        concepts = build_concepts(
            all_tokens
        )

        files.append({

            "repository":
                repository_name,

            "branch":
                branch,

            "path":
                item.path,

            "extension":
                path_object.suffix.lower(),

            "sha":
                item.sha,

            "size":
                getattr(item, "size", 0),

            "tokens":
                sorted(set(all_tokens)),

            "concepts":
                sorted(
                    set(
                        repository_concepts
                        + concepts
                    )
                ),
        })

    print(
        f"  Indexed {len(files)} files "
        f"from {repository_name}"
    )

    return files


def load_github_knowledge():

    knowledge = []

    print()
    print("=" * 80)
    print("BUILDING GITHUB FILE INDEX")
    print("=" * 80)

    user = github.get_user()

    repositories = user.get_repos(
        type="all"
    )

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
# SEARCH GITHUB KNOWLEDGE
# ============================================================

def search_github_knowledge(
    github_knowledge,
    search_terms,
    max_results=5
):

    if not search_terms:
        return []

    terms = []

    for term in search_terms:

        term = term.lower().strip()

        if (
            term
            and term not in terms
            and len(term) > 2
        ):
            terms.append(term)

    # --------------------------------------------------------
    # Expand user language into concepts.
    # --------------------------------------------------------

    expanded_concepts = set()

    for term in terms:

        for concept, aliases in CONCEPT_ALIASES.items():

            if term in aliases:

                expanded_concepts.add(
                    concept
                )

    results = []

    for file in github_knowledge:

        repository = file[
            "repository"
        ].lower()

        path = file[
            "path"
        ].lower()

        filename = Path(
            path
        ).name.lower()

        file_tokens = set(
            file.get(
                "tokens",
                []
            )
        )

        file_concepts = set(
            file.get(
                "concepts",
                []
            )
        )

        score = 0

        # ----------------------------------------------------
        # Direct matches
        # ----------------------------------------------------

        for term in terms:

            if term in filename:
                score += 30

            if term in path:
                score += 15

            if term in repository:
                score += 10

            if term in file_tokens:
                score += 8

        # ----------------------------------------------------
        # Concept matches
        # ----------------------------------------------------

        for concept in expanded_concepts:

            if concept in file_concepts:
                score += 20

        # ----------------------------------------------------
        # Extension relevance
        # ----------------------------------------------------

        extension = file[
            "extension"
        ]

        if (
            "sql" in expanded_concepts
            and extension == ".sql"
        ):
            score += 15

        if (
            "python" in expanded_concepts
            and extension == ".py"
        ):
            score += 15

        if (
            "frontend" in expanded_concepts
            and extension in {
                ".html",
                ".css",
                ".js",
                ".jsx",
                ".ts",
                ".tsx",
            }
        ):
            score += 10

        # ----------------------------------------------------
        # Skip irrelevant files.
        # ----------------------------------------------------

        if score == 0:
            continue

        results.append({

            "repository":
                file["repository"],

            "branch":
                file["branch"],

            "path":
                file["path"],

            "extension":
                file["extension"],

            "sha":
                file["sha"],

            "size":
                file["size"],

            "score":
                score,
        })

    results.sort(
        key=lambda item:
            item["score"],
        reverse=True
    )

    return results[:max_results]


# ============================================================
# RETRIEVE ACTUAL FILE CONTENT
# ============================================================

def load_file_content(file):

    try:

        repo = get_repository(
            file["repository"]
        )

        if repo is None:
            return None

        if (
            file["size"]
            and file["size"] > MAX_FILE_SIZE
        ):

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

            "repository":
                file["repository"],

            "branch":
                file["branch"],

            "path":
                file["path"],

            "content":
                content,

            "score":
                file["score"],
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

    matching_files = search_github_knowledge(
        github_knowledge,
        search_terms,
        max_results=max_results
    )

    relevant_files = []

    for file in matching_files:

        content = load_file_content(
            file
        )

        if content is None:
            continue

        relevant_files.append(
            content
        )

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

    test_questions = [

        [
            "database",
            "sql",
            "enterprise",
        ],

        [
            "python",
            "automation",
        ],

        [
            "powerbi",
            "reporting",
            "analytics",
        ],

        [
            "web",
            "api",
            "backend",
        ],

    ]

    for test_terms in test_questions:

        print()
        print(
            "=" * 60
        )

        print(
            "TEST:",
            " ".join(test_terms)
        )

        results = search_github_knowledge(
            knowledge,
            test_terms,
            max_results=5
        )

        for result in results:

            print(
                result["score"],
                result["repository"],
                result["path"]
            )
```
