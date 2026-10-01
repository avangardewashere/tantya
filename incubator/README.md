# Incubator

A holding place, on this branch only, for a project that does not have its own reachable repository yet.

## `fieldnote-block-1.bundle`

The Fieldnote repository after Block 1, as a Git bundle: all branches (`master` at Block 0,
`block-1-write-today` one commit ahead), no `node_modules`. It is here because the session cannot reach
`avangardewashere/fieldnote` on GitHub.

To bring it back to life:

```bash
git clone fieldnote-block-1.bundle fieldnote
cd fieldnote
git checkout master
git remote set-url origin https://github.com/avangardewashere/fieldnote.git
git push -u origin master block-1-write-today
npm install && npm test
```

Once the push is up, delete this folder.
