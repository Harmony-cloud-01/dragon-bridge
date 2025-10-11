# Harmony Cloud Local Repository Setup

This repository provides a helper script to create a local Git checkout from
the Harmony Cloud OneDrive share that was provided in the review brief.

Because direct access to the share may require authentication or network
permissions, the script focuses on automating the download, extraction, and git
initialization steps. Run the script from the project root:

```bash
./scripts/setup-onedrive-repo.sh
```

By default the project will be downloaded into `external/harmony-cloud-01`. You
can override the destination directory:

```bash
./scripts/setup-onedrive-repo.sh /path/to/desired/location
```

The script performs the following operations:

1. Downloads the OneDrive share archive via `curl` (or reuses a manually
   downloaded `harmony-cloud-01.zip` placed next to the script).
2. Extracts the `.zip` file into the target directory.
3. Flattens the directory structure if OneDrive wrapped the folder contents in a
   single parent directory.
4. Initializes a Git repository (if one does not already exist) and stages the
   imported files. It will create an initial commit only when your Git user name
   and email are configured.

If the environment cannot access OneDrive directly, the script will exit with
an error message. In that case, download the archive manually via a browser and
place the `.zip` file next to the script before re-running it; the script will
detect the local file and continue with extraction and git initialization.
