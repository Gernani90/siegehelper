# Siege Helper - Git e deploy

## 1. Criar o repositorio local

```bash
git init
git add .
git commit -m "Initial Siege Helper app"
```

## 2. Publicar no GitHub

Crie um repositorio vazio no GitHub e rode:

```bash
git branch -M main
git remote add origin git@github.com:SEU_USUARIO/siege-helper.git
git push -u origin main
```

Se preferir HTTPS:

```bash
git remote add origin https://github.com/SEU_USUARIO/siege-helper.git
git push -u origin main
```

## 3. Subir online no Render

1. Entre em https://render.com.
2. Conecte sua conta do GitHub.
3. Escolha "New Blueprint".
4. Selecione este repositorio.
5. O Render vai ler o arquivo `render.yaml` e criar:
   - `siege-helper-api`: backend FastAPI.
   - `siege-helper-web`: frontend Node.
   - `siege-helper-db`: banco Postgres.

Depois do primeiro deploy, abra a URL do servico `siege-helper-web`.

## 4. Rodar localmente

Backend:

```bash
cd app/backend
DATABASE_URL=sqlite:///./local_app.db PYTHON_BACKEND_URL=http://127.0.0.1:8000 IS_LAMBDA=false ENVIRONMENT=dev .venv/bin/python -m uvicorn main:app --host 127.0.0.1 --port 8000
```

Frontend:

```bash
cd app/frontend
PYTHON_BACKEND_URL=http://127.0.0.1:8000 node serve-dist.mjs
```

