# Python Project Templates

Example Python project templates for opencode integration.

## Available Templates

### 1. FastAPI API Template
Production-ready FastAPI web application with:
- Async SQLAlchemy with PostgreSQL
- JWT authentication
- Alembic migrations
- Pytest with async support
- Docker and Docker Compose
- Structured logging
- Configuration management

### 2. Data Science Template
Data science/analysis project with:
- Jupyter notebook support
- pandas, numpy, matplotlib
- scikit-learn for ML
- Experiment tracking
- Data visualization
- Model serialization

### 3. Machine Learning Template
Machine learning project with:
- PyTorch/TensorFlow support
- Training pipelines
- Model evaluation
- Hyperparameter tuning
- Experiment tracking (MLflow/W&B)
- Model deployment

### 4. CLI Tool Template
Command-line interface tool with:
- Click/Typer framework
- Argument parsing
- Configuration management
- Logging
- Testing with pytest
- Packaging for PyPI

### 5. Library Package Template
Python library/package with:
- Modern packaging (pyproject.toml)
- Type hints
- Comprehensive testing
- Documentation (Sphinx/MkDocs)
- CI/CD configuration
- Publishing to PyPI

## Using Templates

### Quick Start
```bash
# Create new project from template
mkdir my-project
cd my-project

# Run opencode setup
node ../scripts/interactive-setup.js

# Follow interactive wizard to configure project type
```

### Manual Setup
1. Choose template type
2. Copy template files
3. Update project name and metadata
4. Run `/python-setup` to configure
5. Install dependencies with `/python-deps install`

## Template Structure

Each template includes:

### Core Files
- `pyproject.toml` - Project configuration and dependencies
- `README.md` - Project documentation
- `.gitignore` - Git ignore patterns
- `.env.example` - Environment variables template

### Source Code
- `src/` - Package source code
- `tests/` - Test suite
- `docs/` - Documentation (if applicable)

### Configuration
- `.opencode/project-config.json` - opencode configuration
- Tool configuration (`.ruff.toml`, `pyrightconfig.json`, etc.)

### Development
- `Dockerfile` and `docker-compose.yml` (if applicable)
- CI/CD configuration (GitHub Actions, GitLab CI)
- Pre-commit hooks

## Customizing Templates

### Project Type Detection
Templates include markers for automatic detection:
- **FastAPI**: `fastapi` in dependencies, `main.py` with FastAPI app
- **Data Science**: `pandas`, `numpy` in dependencies, `.ipynb` files
- **Machine Learning**: `torch`, `tensorflow` in dependencies
- **CLI Tool**: `click`, `typer` in dependencies, `cli.py` file
- **Library**: `setuptools`, `wheel` in build-system

### Configuration
Update these files for your project:
1. `pyproject.toml` - Project name, version, dependencies
2. `README.md` - Project documentation
3. `.env.example` - Environment variables
4. Source code files - Implement your functionality

## Integration with opencode

### Automatic Configuration
When you run `/python-setup` in a template:
1. Project type is automatically detected
2. Appropriate tools are configured
3. Development environment is set up
4. Configuration is saved to `.opencode/project-config.json`

### Available Commands
After setup, these commands are available:
- `/python-test` - Run tests
- `/python-lint` - Lint and format code
- `/python-typecheck` - Type checking
- `/python-deps` - Manage dependencies
- `/python-setup` - Reconfigure project

## Creating New Templates

### Template Requirements
1. Clear project type markers
2. Complete `pyproject.toml` with dependencies
3. Basic working example
4. Testing setup
5. Documentation

### Detection Markers
Add these to your template for automatic detection:

```python
# In pyproject.toml
[project]
name = "template-name"
# Include framework-specific dependencies

# In source files
# Include framework-specific imports or patterns
```

### Testing
Templates should include:
- Basic test suite
- Example tests that pass
- Test configuration in `pyproject.toml`

## Contributing

1. Create new template directory
2. Include all necessary files
3. Add to this README
4. Test with `/python-setup`
5. Ensure all commands work

## Notes

- Templates are starting points, customize as needed
- Keep dependencies up to date
- Follow Python best practices
- Include type hints where possible
- Document configuration options