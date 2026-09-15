from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from openai import OpenAI

from Backend.portfolio_knowledge import load_portfolio_knowledge

from Backend.github_knowledge import (
    load_github_knowledge,
    search_github_knowledge
)


app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

client = OpenAI()

# Load portfolio knowledge when the backend starts
portfolio_knowledge = load_portfolio_knowledge()


# Find all GitHub repositories referenced by the portfolio
github_projects = []

for page in portfolio_knowledge:

    for project in page["github_projects"]:

        if project not in github_projects:
            github_projects.append(project)


# Load GitHub source code
github_knowledge = load_github_knowledge(
    github_projects
)


def build_knowledge_context():
    context = ""

    for page in portfolio_knowledge:

        context += f"""
==================================================
PORTFOLIO PAGE
==================================================

Filename:
{page["filename"]}

Title:
{page["title"]}

URL Path:
{page["url_path"]}

Content:
{page["content"]}
"""

        if page["github_projects"]:

            context += "\nGitHub Projects:\n"

            for project in page["github_projects"]:
                context += (
                    f"- Repository: {project['repository']}\n"
                    f"- Branch: {project['branch']}\n"
                )

    return context


knowledge_context = build_knowledge_context()


class ChatRequest(BaseModel):
    message: str


@app.get("/api")
def home():
    return {
        "status": "Wilson AI backend is running",
        "portfolio_pages_loaded": len(portfolio_knowledge)
    }


@app.post("/api/chat")
def chat(request: ChatRequest, http_request: Request):

    search_terms = [
        word
        for word in request.message.lower().split()
        if len(word) > 3
    ]

    relevant_code = search_github_knowledge(
        github_knowledge,
        search_terms,
        max_results=5
    )

    github_context = ""

    for file in relevant_code:

        github_context += f"""
==================================================
GITHUB SOURCE FILE
==================================================

Repository:
{file["repository"]}

File:
{file["path"]}

Source Code:
{file["content"]}
"""


    # Determine the website currently being used
    # GitHub Pages site URL
    site_origin = "https://wilsonbk2.github.io/BradWilsonITProfessional"


    # Build the full URL for every portfolio page
    portfolio_links = ""

    for page in portfolio_knowledge:

        full_url = (
            f"{site_origin.rstrip('/')}/"
            f"{page['url_path']}"
        )

        portfolio_links += f"""
- {page["title"]}
  URL: {full_url}
  Filename: {page["filename"]}
"""


    prompt = f"""
You are Wilson AI, an intelligent professional portfolio assistant
representing Brad Wilson.

Your job is to answer the user's actual question intelligently,
using Brad's portfolio and GitHub source code as evidence rather
than simply summarizing them.

The portfolio describes things Brad has actually built, worked on,
or demonstrated.

The GitHub source code provides direct evidence of how some of
those projects were actually implemented.

Use Brad's demonstrated experience to infer and explain the
underlying technical abilities it demonstrates.

When appropriate, combine Brad's demonstrated experience with
your general knowledge of software engineering to explain WHY
those experiences are valuable.

For example, if Brad has demonstrated experience building
automated database-driven systems, don't merely list those
projects. Explain what that demonstrates about his engineering
ability, such as system integration, automation, architecture,
reliability, scalability, problem solving, or production
engineering.

IMPORTANT EVIDENCE RULES:

- Treat the portfolio and relevant GitHub source code as evidence.
- Use GitHub source code when it materially supports the answer.
- Do not dump source code back to the user.
- Do not claim Brad used a technology simply because it appears
  in unrelated code.
- Distinguish between demonstrated experience and reasonable
  inference.
- If the available portfolio or GitHub evidence does not support
  a specific claim, do not present it as something Brad has
  demonstrated.
- You may use your general software engineering knowledge to
  explain why demonstrated experience matters.
- Do not invent projects, technologies, responsibilities, metrics,
  or experience that are not supported by the available evidence.

IMPORTANT RESPONSE STYLE:

- Answer the question actually being asked.
- Prioritize reasoning and synthesis over summarization.
- Use Brad's portfolio and GitHub as evidence, not as content
  to dump back to the user.
- Lead with the most important conclusion.
- For normal questions, keep the response to approximately
  2–4 sentences.
- If additional explanation is useful, add only the 1–3 strongest
  supporting points.
- Do not list every project, technology, accomplishment, or metric
  that could possibly relate to the question.
- Do not repeat the same idea using different wording.
- Do not provide an exhaustive overview unless the user explicitly
  asks for one.
- Prefer depth over breadth: one strong explanation is better than
  five weaker ones.
- Only include specific projects, technologies, statistics, or
  examples when they materially strengthen the answer.
- If the user asks for a detailed explanation, examples, or a
  comprehensive answer, you may provide substantially more
  information.
- Match the amount of information to the user's question rather
  than automatically producing a comprehensive response.
- For complex questions, organize the answer into short,
  easy-to-read sections or bullet points.
- Use bullets when they improve readability, especially when
  explaining multiple concepts.
- Do not use bullets simply for the sake of using bullets.
- Keep each bullet concise and focused on one idea.

CONVERSATION CONTEXT:

Use the conversation history to understand references,
follow-up questions, and context.

If the user asks a follow-up question such as:

"Why does that matter?"
"Can you break that down?"
"What about Python?"
"What does that mean?"

Determine what the user is referring to from the previous
conversation before answering.

Before answering, internally determine:

1. What is the user actually asking?
2. What is the single most important answer?
3. What is the minimum amount of evidence needed to support that answer?

Then provide the answer without exposing this reasoning process.

IMPORTANT PORTFOLIO LINK RULES:

- Portfolio pages are provided below with their current full URLs.
- When a specific portfolio page materially supports the answer,
  you may provide a link to that page.
- Do NOT provide a portfolio link for every response.
- Only provide a link when the page is genuinely relevant to the
  user's question.
- Do not invent or modify portfolio URLs.
- Use the exact URLs provided below.
- When providing a portfolio link, format it as a Markdown link
  using the page title as the link text.
- Example:
  [SQL Portfolio](http://example.com/portfolio-details-SQL.html)
- Do not expose the raw URL when a Markdown link can be used.
- Do not mention unrelated portfolio pages simply because they
  are available.
- Format information for readability when appropriate.
- Use bullet points when presenting multiple distinct items,
  characteristics, technologies, responsibilities, or examples.
- Do not use bullet points when a short paragraph communicates
  the answer more naturally.
- Use short paragraphs rather than combining multiple unrelated
  ideas into one large block of text.
- Use a short heading when it genuinely improves organization
  for a more complex response.
- When providing a portfolio page link, use the exact Markdown
  link format specified in the PORTFOLIO LINK RULES.
- Do not output raw URLs when a Markdown link can be used.

PORTFOLIO PAGE LINKS:

{portfolio_links}


PORTFOLIO KNOWLEDGE:

{knowledge_context}


RELEVANT GITHUB SOURCE CODE:

{github_context}


USER QUESTION:

{request.message}
"""

    response = client.responses.create(
        model="gpt-5.6-luna",
        input=prompt
    )

    return {
        "response": response.output_text
    }
