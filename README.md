# QueryCraft

**Schema-aware natural language to SQL workbench.** QueryCraft turns plain-English questions into SQLite queries, explains the result, validates read-only SQL, and lets you compare four prompt-engineering strategies.

## Features

- Minecraft-inspired, responsive frontend built with HTML, CSS and vanilla JavaScript.
- FastAPI backend.
- Groq as the primary AI provider, with automatic OpenRouter fallback.
- Provider-specific models configurable through environment variables.
- Four documented prompt strategies: baseline, schema-aware, few-shot, and guarded/repair-ready.
- Built-in fictional SQLite employee/project database.
- SQL parsing and read-only enforcement before execution.
- Prompt comparison mode for the same natural-language question.
- No real personal data is included.

## Requirements

- Python 3.10+
- A Groq API key (https://console.groq.com/keys) and/or an OpenRouter API key (https://openrouter.ai/keys).

## Setup (Windows PowerShell)

```powershell
cd querycraft
py -m venv .venv
.venv\Scripts\Activate.ps1
pip install -r requirements.txt
Copy-Item .env.example .env
```

Open `.env` and add your provider keys:

```env
GROQ_API_KEY=your_actual_groq_key
GROQ_MODEL=openai/gpt-oss-120b
OPENROUTER_API_KEY=your_actual_openrouter_key
OPENROUTER_MODEL=meta-llama/llama-3.3-70b-instruct:free
```

Groq is tried first. If its request fails (for example, due to a rate limit or provider outage), QueryCraft automatically tries OpenRouter. You can configure either provider on its own or both. Model availability and free-tier limits are controlled by each provider and can change; if a model is unavailable, change its corresponding model variable to one enabled for your account.

Do not paste your API key into frontend JavaScript, HTML, GitHub, screenshots, or the project report. The key belongs only in `.env`, which is ignored by Git.

## Run

```powershell
uvicorn app.main:app --reload
```

Open http://127.0.0.1:8000

API health check: http://127.0.0.1:8000/api/health

## How to use

1. Keep the built-in sample schema or replace it with your own schema description.
2. Enter a question in plain English.
3. Choose V1, V2, V3 or V4.
4. Click **Generate SQL**.
5. Review the SQL and explanation.
6. Validate the SQL.
7. Execute it against the built-in sample database if the query uses the sample database's tables.
8. Open Prompt Lab and compare all four prompt versions using the same question.

## Prompt versions

| Version | Strategy | Main change |
|---|---|---|
| V1 | Baseline | Direct task instruction and schema |
| V2 | Schema-aware | Strong identifier and ambiguity constraints |
| V3 | Few-shot | Adds example question-to-SQL pairs |
| V4 | Guarded / repair-ready | Adds safety restrictions and validation-error context |

The version comparison is an experiment aid. Save actual outputs, record test inputs and evaluate them against expected SQL/results before claiming that one version performs better.

## Important scope and limitations

- The demo database is a fictional SQLite database created locally on first run.
- Custom schemas can be used for SQL generation, but execution is only supported against the built-in demo database. A custom schema must match the demo database to execute successfully.
- The app currently sends schema and question text to the configured model provider. Do not submit private, confidential, or sensitive data.
- SQL validation is a safety layer, not a guarantee that a query is logically correct. Review generated SQL before relying on it.
- Execution is restricted to read-only SELECT statements and results are capped at 100 rows.
- Prompt outputs may vary by model/version. Record the model name and test conditions in your project evidence.

## Project structure

```text
querycraft/
├── app/
│   ├── __init__.py
│   ├── main.py
│   └── static/
│       ├── index.html
│       ├── styles.css
│       └── app.js
├── .env.example
├── .gitignore
├── requirements.txt
└── README.md
```

## Suggested next experiments

- Prepare at least 10 distinct test questions, including normal, edge, ambiguous and invalid requests.
- Run every prompt version on the same test set.
- Record expected output, actual output, SQL validity, execution correctness and Pass/Fail.
- Save prompt versions and explain the reason for every change.
- Add a custom database upload/import workflow only if time permits.

## Academic integrity

This repository is a starter implementation. The team should run it, inspect it, understand each module, adapt it, and collect genuine experiment results before submitting. Do not report unperformed tests or invented results.
