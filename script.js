// ==UserScript==
// @name         MyAnimeList Bulk Delete – Remove Selected Anime (FAB Version)
// @version      2.4
// @description  Adds checkboxes to select specific anime to delete, accessed via a Floating Action Button (FAB).
// @author       Hamza Haroon
// @namespace    https://github.com/hamzaharoon1314/MyAnimeList-Bulk-Delete
// @license      MIT
// @match        https://myanimelist.net/animelist/*
// @match        https://myanimelist.net/profile/*
// @grant        GM_xmlhttpRequest
// @run-at       document-end
// @icon         https://myanimelist.net/favicon.ico
// ==/UserScript==

(function () {

'use strict';

console.log("Tampermonkey MAL script loaded");

const isAnimelist = location.pathname.startsWith("/animelist/");
const isProfile = location.pathname.startsWith("/profile/");

let animeIDList = [];
window.animeIDList = animeIDList;

const DELETE_DELAY = 150;

/* =========================
   FAB CSS (SHARED)
========================= */

const sharedStyle = document.createElement('style');
sharedStyle.textContent = `
    #mal-fab {
        position: fixed; bottom: 20px; left: 20px; z-index: 100000;
        width: 56px; height: 56px; border-radius: 50%;
        background: #9b59b6; color: white; border: none;
        box-shadow: 0 4px 12px rgba(0,0,0,0.4);
        cursor: pointer; display: flex; align-items: center; justify-content: center;
        transition: transform 0.2s, background 0.2s;
    }
    #mal-fab:hover {
        background: #8e44ad; transform: scale(1.05);
    }
    #mal-fab svg {
        width: 24px; height: 24px; fill: currentColor;
    }
`;
document.head.appendChild(sharedStyle);

/* =========================
   PROFILE PAGE BUTTON
========================= */

if (isProfile) {
    const username = location.pathname.split("/")[2];
    if (!username) return;

    const fab = document.createElement("button");
    fab.id = "mal-fab";
    fab.title = "Open Anime List";
    // List icon
    fab.innerHTML = `<svg viewBox="0 0 24 24"><path d="M3 13h2v-2H3v2zm0 4h2v-2H3v2zm0-8h2V7H3v2zm4 4h14v-2H7v2zm0 4h14v-2H7v2zM7 7v2h14V7H7z"/></svg>`;
    
    fab.onclick = () => {
        window.open(`https://myanimelist.net/animelist/${username}`, "_blank");
    };
    
    document.body.appendChild(fab);
    return;
}

/* =========================
   ONLY RUN BELOW ON ANIMELIST
========================= */

if (!isAnimelist) return;

/* =========================
   CSRF
========================= */

const getCSRFToken = () => {
    const meta = document.querySelector('meta[name="csrf_token"]');
    return meta?.content || null;
};

/* =========================
   UI & CSS INJECTION
========================= */

const style = document.createElement('style');
style.textContent = `
    #mal-bulk-panel {
        position: fixed; bottom: 90px; left: 20px; z-index: 99999;
        background: #1e1e24; color: #f5f5f5; 
        border-radius: 10px; box-shadow: 0 10px 30px rgba(0,0,0,0.6);
        font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
        width: 300px; border: 1px solid #333; overflow: hidden;
        opacity: 0; pointer-events: none; transform: translateY(15px);
        transition: opacity 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275), transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
    }
    #mal-bulk-panel.mal-panel-open {
        opacity: 1; pointer-events: auto; transform: translateY(0);
    }
    .mal-panel-header {
        background: #151519; padding: 12px 16px; font-size: 14px;
        display: flex; justify-content: space-between; align-items: center;
        border-bottom: 1px solid #333;
    }
    .mal-panel-header strong { margin: 0 auto; }
    #mal-panel-body { padding: 16px; }
    .mal-btn-group { display: flex; gap: 10px; margin-bottom: 12px; }
    .mal-btn {
        border: none; padding: 9px 12px; border-radius: 6px; cursor: pointer;
        font-size: 12px; font-weight: 600; transition: all 0.2s ease; flex: 1; text-align: center;
    }
    .mal-btn:disabled { opacity: 0.4; cursor: not-allowed; }
    
    /* Button Colors */
    #mal-btn-inject { background: #3498db; color: white; }
    #mal-btn-inject:hover:not(:disabled) { background: #2980b9; }
    #mal-btn-select { background: #8e44ad; color: white; }
    #mal-btn-select:hover:not(:disabled) { background: #732d91; }
    #mal-btn-delete { background: #e74c3c; color: white; }
    #mal-btn-delete:hover:not(:disabled) { background: #c0392b; }
    
    /* Progress Bar */
    #mal-progress-container { background: #2b2b36; padding: 12px; border-radius: 6px; margin-top: 12px; display: none; }
    #mal-progress-status { font-size: 11px; margin-bottom: 8px; font-family: monospace; color: #ccc; text-align: center; }
    #mal-bar-bg { height: 6px; background: #111; border-radius: 4px; overflow: hidden; }
    #mal-bar-fill { height: 100%; width: 0%; background: #2ecc71; transition: width 0.3s; }
`;
document.head.appendChild(style);

// 1. Create the FAB
const fab = document.createElement("button");
fab.id = "mal-fab";
fab.title = "Bulk Delete Tool";
// Trash can icon
fab.innerHTML = `<svg viewBox="0 0 24 24"><path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/></svg>`;
document.body.appendChild(fab);

// 2. Create the hidden panel
const panel = document.createElement("div");
panel.id = "mal-bulk-panel";
panel.innerHTML = `
    <div class="mal-panel-header">
        <strong>MAL Bulk Delete</strong>
    </div>
    <div id="mal-panel-body">
        <div class="mal-btn-group">
            <button id="mal-btn-inject" class="mal-btn">Inject Checkboxes</button>
        </div>
        <div class="mal-btn-group" style="margin-bottom:0;">
            <button id="mal-btn-select" class="mal-btn" disabled>Select All</button>
            <button id="mal-btn-delete" class="mal-btn" disabled>Delete Selected</button>
        </div>
        <div id="mal-progress-container">
            <div id="mal-progress-status">Ready</div>
            <div id="mal-bar-bg">
                <div id="mal-bar-fill"></div>
            </div>
        </div>
    </div>
`;
document.body.appendChild(panel);

// Selectors for DOM elements
const injectBtn = document.getElementById("mal-btn-inject");
const selectBtn = document.getElementById("mal-btn-select");
const deleteBtn = document.getElementById("mal-btn-delete");
const progressContainer = document.getElementById("mal-progress-container");
const progressStatus = document.getElementById("mal-progress-status");
const progressFill = document.getElementById("mal-bar-fill");

/* =========================
   UI LOGIC & FUNCTIONS
========================= */

// Toggle Panel Visibility via FAB
fab.onclick = () => {
    panel.classList.toggle("mal-panel-open");
};

// Progress Updater
function updateProgress(done, total){
    const percent = Math.floor((done/total)*100);
    progressStatus.textContent = `Deleting ${done}/${total} (${percent}%)`;
    progressFill.style.width = percent + "%";
}

// Inject Checkboxes
const injectDeleteButtons = () => {
    animeIDList = [];
    window.animeIDList = animeIDList;
    
    const rows = document.querySelectorAll('td.data.progress');
    rows.forEach(cell => {
        const progressDiv = cell.querySelector('div[class^="progress-"]');
        if (!progressDiv) return;

        const match = progressDiv.className.match(/progress-(\d+)/);
        if (!match) return;

        const animeId = match[1];
        animeIDList.push(animeId);

        const tr = cell.closest('tr');
        if (tr && !tr.querySelector('.mal-delete-cb')) {
            const titleTd = tr.querySelector('td.data.title') || tr.querySelector('.title');
            if (titleTd) {
                const cbWrapper = document.createElement("span");
                cbWrapper.innerHTML = `<input type="checkbox" class="mal-delete-cb" data-anime-id="${animeId}" style="width:16px; height:16px; vertical-align:middle; margin-right:8px; cursor:pointer;">`;
                titleTd.prepend(cbWrapper);
            }
        }
    });
};

// Network Request to Delete
function deleteAnime(animeId, csrf){
    return new Promise(resolve => {
        GM_xmlhttpRequest({
            method:'POST',
            url:`https://myanimelist.net/ownlist/anime/${animeId}/delete?hideLayout=1`,
            headers:{
                'Content-Type':'application/x-www-form-urlencoded',
                'Origin':'https://myanimelist.net',
                'Referer':`https://myanimelist.net/ownlist/anime/${animeId}/edit?hideLayout=1`
            },
            data:`csrf_token=${encodeURIComponent(csrf)}`,
            onload:res=>{
                if(res.status === 200){
                    const row = document.querySelector(`div.progress-${animeId}`)?.closest("tr");
                    if(row){
                        row.style.opacity = "0.4";
                        setTimeout(()=>row.remove(),500);
                    }
                }
                resolve();
            }
        });
    });
}

// Core Delete Selected Logic
async function deleteSelectedAnime(selectedIDs, csrf){
    let deleted = 0;
    const total = selectedIDs.length;
    
    progressContainer.style.background = "#2b2b36";
    updateProgress(0, total);

    for(const id of selectedIDs){
        await deleteAnime(id, csrf);
        deleted++;
        updateProgress(deleted,total);
        await new Promise(r => setTimeout(r, DELETE_DELAY));
    }

    progressStatus.textContent = `Completed ✔ (${total} removed)`;
    progressContainer.style.background = "#145a32";
}

/* =========================
   BUTTON EVENT LISTENERS
========================= */

injectBtn.onclick = ()=>{
    injectBtn.textContent = "Scanning...";
    injectDeleteButtons();

    if(animeIDList.length === 0){
        alert("No anime found in this list.");
        injectBtn.textContent = "Inject Checkboxes";
        return;
    }

    injectBtn.textContent = "Checkboxes Loaded ✓";
    injectBtn.style.background = "#27ae60";

    selectBtn.disabled = false;
    deleteBtn.disabled = false;
};

let allSelected = false;
selectBtn.onclick = () => {
    allSelected = !allSelected;
    const checkboxes = document.querySelectorAll('.mal-delete-cb');
    checkboxes.forEach(cb => cb.checked = allSelected);
    selectBtn.textContent = allSelected ? "Deselect All" : "Select All";
};

deleteBtn.onclick = async ()=>{
    const checkedBoxes = document.querySelectorAll('.mal-delete-cb:checked');
    const selectedIDs = Array.from(checkedBoxes).map(cb => cb.getAttribute('data-anime-id'));

    if(selectedIDs.length === 0){
        alert("Please check the boxes next to the anime you want to delete.");
        return;
    }

    const csrf = getCSRFToken();
    if(!csrf){
        alert("CSRF token missing");
        return;
    }

    if(!confirm(`Are you sure you want to delete ${selectedIDs.length} selected anime?`)){
        return;
    }

    // Update UI states for deletion
    progressContainer.style.display = "block";
    deleteBtn.textContent = "Deleting...";
    deleteBtn.disabled = true;
    selectBtn.disabled = true;
    injectBtn.disabled = true;

    await deleteSelectedAnime(selectedIDs, csrf);

    // Reset UI states
    deleteBtn.textContent = "Delete Selected";
    deleteBtn.disabled = false;
    selectBtn.disabled = false;
    injectBtn.disabled = false;
    injectBtn.textContent = "Inject Checkboxes";
    injectBtn.style.background = "#3498db";
    
    allSelected = false;
    selectBtn.textContent = "Select All";
};

})();
