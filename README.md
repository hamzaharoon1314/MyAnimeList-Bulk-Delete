# MyAnimeList Bulk Delete

A simple userscript that allows you to **delete all anime from your MyAnimeList list automatically** with a progress indicator.

Managing large MyAnimeList lists can be slow because entries normally must be removed **one by one**.  
This script adds buttons that let you **scan your list and remove all entries automatically**, while showing live progress.

Repository:  
https://github.com/hamzaharoon1314/MyAnimeList-Bulk-Delete

---

# Features

- Adds **Inject Script** button to scan your anime list
- Adds **Delete All** button to remove all entries
- Shows a **live progress bar** while deleting
- Prevents deletion if the list is empty
- Includes confirmation before deleting
- Provides console logs for debugging
- Adds a **quick button on profile pages** to open the anime list

---

### Profile Page

A small button appears that allows you to **open the user's Anime List quickly**.

### Anime List Page

Two buttons will appear in the bottom left corner:

- **Inject Script** – scans the page and collects anime IDs  
- **Delete All** – deletes all collected entries  

---

# How It Works

1. The script loads on your MyAnimeList page.  
2. Click **Inject Script** to scan the anime list and collect all IDs.  
3. After the scan finishes, **Delete All** becomes active.  
4. Click **Delete All** and confirm the action.  
5. The script will delete each entry automatically while displaying progress.  

Rows are visually faded and removed as they are deleted.

A short delay is added between requests to avoid sending too many requests at once.

---

# Installation

## Option 1 — Greasy Fork (Recommended)

1. Install a userscript manager:
   - Tampermonkey
   - Violentmonkey
   - Greasemonkey

2. Install the script from Greasy Fork.
   Link: https://greasyfork.org/en/scripts/568693-myanimelist-bulk-delete-remove-all-anime-with-progress-bar 
3. Open your MyAnimeList anime list page.

The buttons will appear automatically.

---

## Option 2 — Manual Installation (GitHub)

1. Install a userscript manager extension.  
2. Open the script file:

https://github.com/hamzaharoon1314/MyAnimeList-Bulk-Delete/blob/main/script.js

3. Create a new userscript in Tampermonkey.  
4. Paste the script and save.

---

# How to Use

1. Log in to **MyAnimeList**.  
2. Open your anime list.

Example:

```
https://myanimelist.net/animelist/YOUR_USERNAME
```

3. Click **Inject Script**.

This scans the page and collects all anime IDs.

4. Click **Delete All**.

5. Confirm the deletion.

The script will begin removing entries automatically.

---

# Progress Display

A progress panel will appear showing:

- Current status  
- Number of anime deleted  
- Progress percentage  

Example:

```
Deleted 15/120 (12%)
```

When finished:

```
Completed ✔ (120 removed)
```

---

# Warning

Deleting entries is **permanent**.

Once anime are removed from your list, they **cannot be automatically restored**.

Before using the script, consider:

- Backing up your list  
- Exporting your data  
- Confirming you want to delete everything  

---

# Contributing

Contributions and improvements are welcome.

If you find bugs or want to improve the script, feel free to open an issue or submit a pull request.

Repository:

https://github.com/hamzaharoon1314/MyAnimeList-Bulk-Delete

---

# License

MIT License
