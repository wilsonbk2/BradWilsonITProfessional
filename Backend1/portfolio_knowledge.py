from pathlib import Path
from bs4 import BeautifulSoup


# Location of your portfolio website files
# PORTFOLIO_ROOT = Path(r"G:\TECH ENDEAVORS\Brad Wilson Website")
PORTFOLIO_ROOT = Path(__file__).resolve().parent.parent


PORTFOLIO_PAGES = [
    "index2026.html",
    "portfolio-details-PowerBI.html",
    "portfolio-details-SQL.html",
    "portfolio-details-Quality.html",
    "portfolio-details-Unity.html",
    "portfolio-details-QAPI.html",
    "portfolio-details-Coding.html",
]


def read_portfolio_page(filename):
    path = PORTFOLIO_ROOT / filename

    with open(path, "r", encoding="utf-8") as file:
        html = file.read()

    soup = BeautifulSoup(html, "html.parser")

    # Remove elements that aren't useful to the AI
    for element in soup(["script", "style", "noscript"]):
        element.decompose()

    # Get page title
    title = soup.title.get_text(strip=True) if soup.title else filename

    # Get visible page text
    content = soup.get_text(
        separator="\n",
        strip=True
    )

    # Find GitHub project information
    github_projects = []

    for element in soup.select(".github-code-explorer"):
        repository = element.get("data-repository")
        branch = element.get("data-branch")

        if repository:
            github_projects.append({
                "repository": repository,
                "branch": branch
            })

    return {
        "filename": filename,
        "title": title,
        "url_path": filename,
        "content": content,
        "github_projects": github_projects
    }


def load_portfolio_knowledge():
    knowledge = []

    for page in PORTFOLIO_PAGES:
        knowledge.append(read_portfolio_page(page))

    return knowledge


if __name__ == "__main__":

    knowledge = load_portfolio_knowledge()

    for page in knowledge:

        print("\n" + "=" * 80)
        print(page["filename"])
        print("=" * 80)

        print(f"URL Path: {page['url_path']}")

        print(page["content"])

        if page["github_projects"]:

            print("\nGITHUB PROJECTS:")

            for project in page["github_projects"]:
                print(f"Repository: {project['repository']}")
                print(f"Branch: {project['branch']}")