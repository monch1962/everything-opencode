# Rust Doc Command

Generate Rust documentation with rustdoc, featuring intelligent configuration and hosting options.

## Overview

The `/rust-doc` command generates documentation for Rust crates using rustdoc (Cargo's documentation tool). It produces professional, searchable documentation with cross-references, source code links, and interactive examples. The command supports multiple output formats, documentation hosting, and custom documentation configuration.

## Features

- **rustdoc Integration**: Full rustdoc compatibility with enhanced features
- **Multiple Output Formats**: HTML, JSON, Markdown, and custom formats
- **Documentation Hosting**: Deploy to GitHub Pages, docs.rs, or custom servers
- **Cross-Crate Documentation**: Document workspaces and dependency trees
- **Interactive Examples**: Run and test code examples in documentation
- **Custom Themes**: Apply custom CSS themes and templates
- **Search Indexing**: Generate searchable documentation with type-ahead
- **API Documentation**: Automatic API documentation from code comments
- **Documentation Testing**: Test code examples in documentation

## Usage

```bash
/rust-doc [options] [cargo-doc-options...]
```

### Options

| Option        | Short | Description                                |
| ------------- | ----- | ------------------------------------------ |
| `--open`      | `-o`  | Open documentation in browser              |
| `--serve`     | `-s`  | Serve documentation locally                |
| `--port`      | `-p`  | Port for local server                      |
| `--format`    | `-f`  | Output format (html, json, markdown)       |
| `--theme`     | `-t`  | Documentation theme                        |
| `--no-deps`   |       | Don't build documentation for dependencies |
| `--package`   |       | Package to document                        |
| `--workspace` | `-w`  | Document all crates in workspace           |
| `--help`      | `-h`  | Show help message                          |

## Examples

### Generate documentation

```bash
/rust-doc
```

Generates HTML documentation in `target/doc/`.

### Open in browser

```bash
/rust-doc --open
```

Generates and opens documentation in default browser.

### Serve documentation

```bash
/rust-doc --serve --port 8080
```

Serves documentation on localhost:8080.

### JSON format

```bash
/rust-doc --format json
```

Generates documentation in JSON format for programmatic use.

### Workspace documentation

```bash
/rust-doc --workspace
```

Generates documentation for all crates in workspace.

### Custom theme

```bash
/rust-doc --theme dark
```

Generates documentation with dark theme.

## Configuration

### Cargo.toml Documentation Configuration

Configure documentation generation in `Cargo.toml`:

```toml
[package]
name = "my-crate"
version = "0.1.0"

# Documentation metadata
[package.metadata.docs]
# Documentation settings
default-target = "html"
theme = "ayu"
mathjax-support = true
search-index = true

# Documentation links
[package.metadata.docs.links]
repository = "https://github.com/user/repo"
homepage = "https://my-crate.rs"
documentation = "https://docs.rs/my-crate"

# Documentation features
[package.metadata.docs.features]
search = true
dark-mode = true
source-links = true
```

### rustdoc Configuration

Create `.rustdoc.toml` for custom rustdoc configuration:

```toml
# .rustdoc.toml
[html]
theme = "ayu"
mathjax-support = true
search-index = true
source-code-links = true

[markdown]
header = "# My Crate Documentation"
footer = "Generated with rustdoc"

[server]
port = 8080
host = "localhost"
open-browser = true

[deploy]
target = "github-pages"
branch = "gh-pages"
directory = "docs"
```

### Documentation Themes

The command supports multiple themes:

- **default**: Rust standard theme
- **ayu**: Dark theme with good contrast
- **dark**: Pure dark theme
- **light**: High-contrast light theme
- **custom**: Use custom CSS theme

## Documentation Generation

### Basic Documentation

```bash
# Generate standard documentation
/rust-doc

# Output will be in target/doc/<crate_name>/index.html
```

### Advanced Features

```bash
# Generate with all features
/rust-doc --all-features --document-private-items

# Generate with specific Rust edition
/rust-doc --edition 2021

# Generate for specific target
/rust-doc --target x86_64-unknown-linux-gnu
```

### Documentation Testing

```bash
# Test documentation examples
/rust-doc --test

# Test specific documentation examples
/rust-doc --test --doc-tests

# Generate testable documentation
/rust-doc --test --no-run
```

## Documentation Hosting

### Local Serving

```bash
# Serve documentation locally
/rust-doc --serve --port 3000

# Serve with auto-reload
/rust-doc --serve --watch

# Serve with specific host
/rust-doc --serve --host 0.0.0.0 --port 8080
```

### GitHub Pages Deployment

```bash
# Deploy to GitHub Pages
/rust-doc --deploy github-pages

# Deploy to specific branch
/rust-doc --deploy github-pages --branch docs

# Deploy with custom domain
/rust-doc --deploy github-pages --domain docs.my-crate.rs
```

### docs.rs Deployment

```bash
# Prepare for docs.rs
/rust-doc --format docs-rs

# Check docs.rs compatibility
/rust-doc --check-docs-rs

# Generate docs.rs metadata
/rust-doc --docs-rs-metadata
```

### Custom Server Deployment

```bash
# Deploy to AWS S3
/rust-doc --deploy s3 --bucket my-docs

# Deploy to Netlify
/rust-doc --deploy netlify --site my-site

# Deploy to Vercel
/rust-doc --deploy vercel --project my-project
```

## Documentation Formats

### HTML Documentation

```bash
# Standard HTML documentation
/rust-doc --format html

# HTML with search
/rust-doc --format html --search

# HTML with custom assets
/rust-doc --format html --assets ./assets
```

### JSON Documentation

```bash
# JSON for programmatic use
/rust-doc --format json

# JSON with pretty printing
/rust-doc --format json --pretty

# JSON schema
/rust-doc --format json-schema
```

### Markdown Documentation

```bash
# Markdown for README generation
/rust-doc --format markdown

# Markdown with frontmatter
/rust-doc --format markdown --frontmatter

# Markdown for specific sections
/rust-doc --format markdown --sections "api,examples"
```

### Custom Formats

```bash
# Custom template
/rust-doc --format custom --template ./template.html

# Multiple formats
/rust-doc --formats html,json,markdown

# Format-specific options
/rust-doc --format html --minify --compress
```

## Integration

### With Cargo Workspace

```bash
# Document entire workspace
/rust-doc --workspace

# Document specific workspace members
/rust-doc --package crate-a --package crate-b

# Document with workspace features
/rust-doc --workspace --all-features
```

### With Documentation Testing

```bash
# Generate and test documentation
/rust-doc --test

# Test documentation examples only
/rust-doc --doc-tests

# Generate test coverage for documentation
/rust-doc --test-coverage
```

### With CI/CD Pipeline

```bash
# Generate documentation in CI
/rust-doc --format html --output ./docs

# Deploy documentation after successful build
/rust-doc --deploy github-pages --token $GITHUB_TOKEN

# Validate documentation
/rust-doc --validate
```

### With Other Commands

```bash
# Build and document
/rust-build && /rust-doc

# Check, test, and document
/rust-check && /rust-test && /rust-doc

# Complete documentation pipeline
/rust-fmt && /rust-clippy && /rust-doc
```

## Custom Documentation

### Custom CSS Themes

```bash
# Use custom CSS theme
/rust-doc --theme ./custom-theme.css

# Multiple theme files
/rust-doc --theme ./theme.css --theme ./overrides.css

# Theme from URL
/rust-doc --theme https://example.com/theme.css
```

### Custom Templates

```bash
# Custom HTML template
/rust-doc --template ./custom-template.html

# Template with variables
/rust-doc --template ./template.html --template-vars '{"title":"My Docs"}'

# Multiple templates
/rust-doc --templates ./header.html,./content.html,./footer.html
```

### Documentation Metadata

```bash
# Add custom metadata
/rust-doc --metadata '{"version":"1.0.0","author":"Me"}'

# Metadata from file
/rust-doc --metadata-file ./metadata.json

# Generate metadata
/rust-doc --generate-metadata
```

## Performance

### Incremental Documentation

```bash
# Only regenerate changed documentation
/rust-doc --incremental

# Cache documentation generation
/rust-doc --cache

# Skip dependency documentation
/rust-doc --no-deps
```

### Parallel Generation

```bash
# Generate documentation in parallel
/rust-doc --parallel

# Limit parallel jobs
/rust-doc --jobs 4

# Parallel with memory limits
/rust-doc --parallel --memory-limit 2G
```

### Optimization

```bash
# Minify documentation
/rust-doc --minify

# Compress assets
/rust-doc --compress

# Optimize images
/rust-doc --optimize-images
```

## Troubleshooting

### Common Issues

#### Documentation Generation Failures

```bash
# Show detailed error information
/rust-doc --verbose

# Check rustdoc version compatibility
/rust-doc --check-version

# Generate with minimal features
/rust-doc --minimal
```

#### Missing Documentation

```bash
# Document private items
/rust-doc --document-private-items

# Include all items
/rust-doc --all

# Check documentation coverage
/rust-doc --coverage
```

#### Theme Issues

```bash
# Use default theme
/rust-doc --theme default

# Check theme compatibility
/rust-doc --check-theme

# Generate without theme
/rust-doc --no-theme
```

### Debugging

#### Documentation Quality

```bash
# Check documentation quality
/rust-doc --lint

# Validate documentation links
/rust-doc --check-links

# Check documentation examples
/rust-doc --check-examples
```

#### Performance Issues

```bash
# Profile documentation generation
/rust-doc --profile

# Generate timing information
/rust-doc --timings

# Memory usage information
/rust-doc --memory-usage
```

#### Deployment Issues

```bash
# Dry run deployment
/rust-doc --deploy-dry-run

# Check deployment configuration
/rust-doc --check-deploy

# Test deployment locally
/rust-doc --test-deploy
```

## Advanced Features

### Documentation Versioning

```bash
# Generate versioned documentation
/rust-doc --version 1.0.0

# Multiple versions
/rust-doc --versions 1.0.0,1.1.0,2.0.0

# Version selector
/rust-doc --version-selector
```

### Internationalization

```bash
# Generate documentation in specific language
/rust-doc --language en

# Multiple languages
/rust-doc --languages en,es,fr

# Language-specific assets
/rust-doc --language en --assets ./i18n/en
```

### Accessibility

```bash
# Generate accessible documentation
/rust-doc --accessibility

# Check accessibility compliance
/rust-doc --check-accessibility

# Generate accessibility report
/rust-doc --accessibility-report
```

## Related Commands

- `/rust-build` - Build Rust projects
- `/rust-test` - Run tests
- `/rust-check` - Check code
- `/rust-clippy` - Lint code
- `/rust-fmt` - Format code
- `/rust-run` - Run applications
- `/js-doc` - Generate JavaScript documentation
- `/python-doc` - Generate Python documentation
