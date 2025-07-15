# GitHub Setup Instructions

Follow these steps to publish your PhotoEditor Demo project to GitHub.

## 1. Initialize Git Repository (if not already done)

```bash
# Navigate to your project directory
cd path/to/photoEditorDemo

# Initialize Git repository
git init
```

## 2. Add Files to Git

```bash
# Add all files to Git
git add .

# Alternatively, add specific files
git add package.json README.md LICENSE COMPONENTS.md src/ public/
```

## 3. Create Initial Commit

```bash
# Create initial commit
git commit -m "Initial commit: PhotoEditor Demo with multi-library adapter architecture"
```

## 4. Create GitHub Repository

1. Go to [GitHub](https://github.com/)
2. Log in to your account
3. Click the "+" icon in the top right corner
4. Select "New repository"
5. Enter repository name: `photoEditorDemo`
6. Add a description: "A comprehensive Vue.js image editor demo with multi-library adapter architecture"
7. Choose visibility (Public or Private)
8. Do NOT initialize with README, .gitignore, or license (we already have these)
9. Click "Create repository"

## 5. Connect Local Repository to GitHub

```bash
# Add GitHub repository as remote
git remote add origin https://github.com/LuoLeYan/photoEditorDemo.git

# Push to GitHub
git push -u origin main
```

If your default branch is named `master` instead of `main`, use:

```bash
git push -u origin master
```

## 6. Set Up GitHub Pages (Optional)

To deploy your demo to GitHub Pages:

1. Go to your repository on GitHub
2. Click "Settings"
3. Scroll down to "GitHub Pages" section
4. Select "gh-pages" branch or "main/docs" folder as source
5. Click "Save"

## 7. Configure Vue.js for GitHub Pages (Optional)

If you want to deploy to GitHub Pages, add a `vue.config.js` file to your project:

```javascript
// vue.config.js
module.exports = {
  publicPath: process.env.NODE_ENV === 'production'
    ? '/photoEditorDemo/'
    : '/',
  outputDir: 'dist'
}
```

Then build and deploy:

```bash
# Build for production
npm run build

# Create gh-pages branch and push dist folder
git checkout -b gh-pages
git add -f dist
git commit -m "Deploy to GitHub Pages"
git subtree push --prefix dist origin gh-pages
```

## 8. Update Repository Settings (Optional)

Consider adding these to your GitHub repository:

1. **Topics**: vue, image-editor, canvas, graphics, konva, fabric
2. **Description**: Update with a concise project description
3. **Website**: Add link to GitHub Pages demo if deployed
4. **Social Preview**: Add a screenshot of your editor in action

## 9. Continuous Integration (Optional)

Consider setting up GitHub Actions for CI/CD:

1. Create `.github/workflows/ci.yml` file
2. Configure to run tests and linting on push
3. Set up automatic deployment to GitHub Pages

## 10. Keeping Repository Updated

```bash
# After making changes
git add .
git commit -m "Description of changes"
git push origin main
```

## Troubleshooting

### Authentication Issues
If you encounter authentication issues, consider using:

```bash
# Using GitHub CLI
gh auth login

# Or set up SSH keys
ssh-keygen -t ed25519 -C "your_email@example.com"
```

### Large Files
If you have large files that exceed GitHub's file size limits:

```bash
# Install Git LFS
git lfs install

# Track large files
git lfs track "*.psd" "*.ai" "*.sketch"
```

### Merge Conflicts
If you encounter merge conflicts:

```bash
# Pull latest changes
git pull origin main

# Resolve conflicts manually
# Then commit resolved changes
git add .
git commit -m "Resolve merge conflicts"
git push origin main
```
