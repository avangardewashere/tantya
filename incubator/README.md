# Incubator

A holding place, on this branch only, for a project that does not have its own repository yet.

## `fieldnote-block-0.bundle`

The Fieldnote repository after Block 0, as a Git bundle (the full history, two commits, no
`node_modules`). It is here because the session that built it could not create a GitHub repository.

To bring it back to life:

```bash
git clone fieldnote-block-0.bundle fieldnote
cd fieldnote
git remote set-url origin https://github.com/avangardewashere/fieldnote.git
git push -u origin master
npm install && npm test
```

Once `avangardewashere/fieldnote` exists and has the push, delete this folder.
