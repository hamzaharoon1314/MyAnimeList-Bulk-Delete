// ==UserScript==
// @name         MyAnimeList Bulk Delete – Remove All Anime with Progress Bar
// @version      2.1
// @description  Adds Inject Script and Delete All buttons to MyAnimeList anime lists. Scans the list, collects anime IDs, deletes them automatically, and shows a live progress bar while entries are removed.
// @author       Hamza Haroon
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
   PROFILE PAGE BUTTON
========================= */

if (isProfile) {

    const username = location.pathname.split("/")[2];
    if (!username) return;

    const btn = document.createElement("button");

    btn.textContent = "Open Anime List";

    Object.assign(btn.style,{
        position:'fixed',
        bottom:'20px',
        left:'20px',
        zIndex:'9999',
        background:'#9b59b6',
        color:'#fff',
        border:'none',
        padding:'10px 14px',
        borderRadius:'6px',
        cursor:'pointer',
        fontSize:'13px'
    });

    btn.onclick = () => {
        window.open(`https://myanimelist.net/animelist/${username}`, "_blank");
    };

    document.body.appendChild(btn);

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
   PROGRESS PANEL
========================= */

const progressBox = document.createElement("div");

Object.assign(progressBox.style,{
position:'fixed',
bottom:'70px',
left:'20px',
zIndex:'9999',
background:'#222',
color:'#fff',
padding:'12px',
borderRadius:'8px',
fontSize:'13px',
fontFamily:'monospace',
minWidth:'220px',
boxShadow:'0 5px 12px rgba(0,0,0,0.4)'
});

progressBox.innerHTML = `
<div><b>MAL Delete Progress</b></div>
<div id="malStatus">Idle</div>
<div id="malBar" style="height:6px;background:#444;margin-top:6px;border-radius:4px;">
<div id="malBarFill" style="height:100%;width:0%;background:#2ecc71;border-radius:4px;"></div>
</div>
`;

document.body.appendChild(progressBox);

function updateProgress(done,total){

    const percent = Math.floor((done/total)*100);

    document.getElementById("malStatus").textContent =
        `Deleted ${done}/${total} (${percent}%)`;

    document.getElementById("malBarFill").style.width = percent + "%";

}

/* =========================
   COLLECT IDS
========================= */

const injectDeleteButtons = () => {

    console.log("Inject function started");

    animeIDList = [];
    window.animeIDList = animeIDList;

    const rows = document.querySelectorAll('td.data.progress');

    console.log("Rows found:", rows.length);

    rows.forEach(cell => {

        const progressDiv = cell.querySelector('div[class^="progress-"]');
        if (!progressDiv) return;

        const match = progressDiv.className.match(/progress-(\d+)/);
        if (!match) return;

        const animeId = match[1];

        animeIDList.push(animeId);

    });

    console.log("========= ANIME IDS =========");
    console.log(animeIDList);
    console.log("Total:", animeIDList.length);

    console.table(animeIDList);

};

/* =========================
   DELETE FUNCTION
========================= */

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

                    console.log("Deleted:", animeId);

                    const row = document.querySelector(`div.progress-${animeId}`)?.closest("tr");

                    if(row){
                        row.style.opacity = "0.4";
                        setTimeout(()=>row.remove(),500);
                    }

                }else{
                    console.warn("Failed:", animeId,res.status);
                }

                resolve();

            }
        });

    });

}

/* =========================
   DELETE ALL
========================= */

async function deleteAllAnime(){

    if(animeIDList.length === 0){
        alert("Click Inject Script first");
        return;
    }

    const csrf = getCSRFToken();

    if(!csrf){
        alert("CSRF token missing");
        return;
    }

    if(!confirm(`Delete ${animeIDList.length} anime?`)){
        return;
    }

    console.log("Starting deletion");

    let deleted = 0;
    const total = animeIDList.length;

    for(const id of animeIDList){

        console.log(`Deleting ${deleted+1}/${total} ->`, id);

        await deleteAnime(id, csrf);

        deleted++;

        updateProgress(deleted,total);

        await new Promise(r => setTimeout(r, DELETE_DELAY));

    }

    console.log("Deletion completed");

    document.getElementById("malStatus").textContent =
        `Completed ✔ (${total} removed)`;

    progressBox.style.background = "#145a32";

}

/* =========================
   BUTTONS
========================= */

const container = document.createElement("div");

Object.assign(container.style,{
position:'fixed',
bottom:'20px',
left:'20px',
zIndex:'9999',
display:'flex',
gap:'10px'
});

const injectButton = document.createElement("button");

injectButton.textContent = "Inject Script";

Object.assign(injectButton.style,{
background:'#3498db',
color:'white',
border:'none',
padding:'10px 14px',
borderRadius:'6px',
cursor:'pointer'
});

injectButton.onclick = ()=>{

    console.log("Inject button clicked");

    injectButton.textContent = "Scanning...";
    injectButton.style.background = "#f39c12";

    injectDeleteButtons();

    if(animeIDList.length === 0){
        alert("No anime found in this list.");
		injectButton.textContent = "Inject Script";
		injectButton.style.background = "#3498db";
        return;
    }

    injectButton.textContent = "IDs Loaded ✓";
    injectButton.style.background = "#27ae60";

    deleteAllButton.disabled = false;
    deleteAllButton.style.opacity = "1";

};

const deleteAllButton = document.createElement("button");

deleteAllButton.textContent = "Delete All";
deleteAllButton.disabled = true;   // disabled until IDs loaded
deleteAllButton.style.opacity = "0.5";

Object.assign(deleteAllButton.style,{
background:'#e74c3c',
color:'white',
border:'none',
padding:'10px 14px',
borderRadius:'6px',
cursor:'pointer'
});

deleteAllButton.onclick = async ()=>{

    if(animeIDList.length === 0){
        alert("Anime list is empty.");
        return;
    }

    deleteAllButton.textContent = "Deleting...";
    deleteAllButton.style.background = "#c0392b";
    deleteAllButton.disabled = true;

    await deleteAllAnime();

    deleteAllButton.textContent = "Delete All";
    deleteAllButton.style.background = "#e74c3c";
    deleteAllButton.disabled = false;

};

container.appendChild(injectButton);
container.appendChild(deleteAllButton);

document.body.appendChild(container);

})();
