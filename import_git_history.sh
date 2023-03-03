# current directory is the monorepo
# $1 is the repo to import and is a sibling to the current directory
# $2 is the destination path, eg "packages"

function import_git_history {
  REPO_NAME="$1"
  REPO_PATH="../$REPO_NAME"
  DEST_DIR="$2"
  
  pushd "$REPO_PATH"

  git fetch

  if git rev-parse --verify main ; then
    BRANCH_NAME=main
  else
    BRANCH_NAME=master
  fi

  git checkout origin/$BRANCH_NAME
  git checkout -b tmp/monorepo-import

  # move the files to the subdir they will be located at in the
  # monorepo so that git history isn't borked
  git ls-files | xargs bash -e -x -c '
  for file in "$@"; do
    mkdir -p "$0"/`dirname "$file"`
    git mv "$file" "$0"/`dirname "$file"`/
  done' "$DEST_DIR"

  git commit -a -m "Relocating all files from $REPO_NAME to $DEST_DIR before monorepo import"

  popd

  git remote remove import-repo || true
  git remote add -f import-repo "$REPO_PATH"
  git merge --allow-unrelated-histories import-repo/tmp/monorepo-import -m "import $REPO_NAME"

  pushd "$REPO_PATH"
  git checkout $BRANCH_NAME
  git branch -D tmp/monorepo-import
  popd
}