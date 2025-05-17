// (ต่อจาก js/stage.js ด้านบน)
// ...
window.startStageBattle = async function (chapterId,zoneId,stageId) {
    // โหลด stage data
    let chapter = chapterData.find(ch => ch.id === chapterId);
    if(!chapter) return;
    let zone = chapter.zones.find(z => z.id === zoneId);
    if(!zone) return;
    let stage = zone.stages.find(s => s.id === stageId);
    if(!stage) return;

    // Check energy
    let energy = Number(localStorage.getItem("user_energy") || 0);
    if(energy < stage.require_energy){
        alert("Energy ไม่พอ!");
        return;
    }

    // ลด energy และ update UI energy
    energy -= stage.require_energy;
    localStorage.setItem("user_energy",energy);
    if (typeof renderEnergyBar === "function") renderEnergyBar();

    // Set up battle - simulate 1 wave (extendible)
    window.prepareBattleFromStage(stage);

    // Store currentStage state (เชื่อมต่อกับ battle/result)
    localStorage.setItem('current_stage_id', stage.id);
    localStorage.setItem('current_stage_zone', zone.id);
    localStorage.setItem('current_stage_chapter', chapter.id);

    closePopup();
    document.getElementById('mainBattlefield').classList.remove('hide');
    setTimeout(() => {
        if (window.battleEngine && window.battleEngine.startBattle) {
            window.battleEngine.startBattle();
        }
    }, 777);
};

// (เพิ่ม/แก้ไข) เมื่อจบด่าน ให้ update unlock stage & reward
window.hookStageBattleEnd = function(state) {
    // Call after battle win/lose popup
    // รับ state == "win"|"lose"
    let curStageId = localStorage.getItem('current_stage_id');
    if (state === 'win' && curStageId) {
        window.updateStageProgress(curStageId);
        // เพิ่ม exp/item/gold ตาม stage
        // (ดึง stage จาก chapterData)
        let chapterId = localStorage.getItem('current_stage_chapter');
        let zoneId = localStorage.getItem('current_stage_zone');
        let chapter = chapterData.find(c=>c.id===chapterId);
        let zone = chapter && chapter.zones.find(z=>z.id===zoneId);
        let stage = zone && zone.stages.find(s=>s.id===curStageId);
        if (stage && stage.drops && stage.drops.length) {
            // แจก drop
            let dropList = [];
            stage.drops.forEach(d => {
                if (Math.random()*100 < d.rate) {
                    let n = randInt(d.min,d.max);
                    dropList.push({type:'item',id:d.id,qty:n});
                }
            });
            window.rewardEngine?.give(dropList);
        }
        // แจก exp
        if(stage && stage.exp_reward) window.rewardEngine?.give([{type:'exp',qty:stage.exp_reward}]);
    }
    // unlock
    setTimeout(()=>{ openStageMapPopup(); }, 1000);
};

// (เรียกใน result.js รองรับการอัปเดต progress)
window.updateStageProgress = function(stageId) {
    loadStageProgress();
    stageProgress[stageId] = true;
    saveStageProgress();
};

// export (ต่อ)
window.stageEngine = Object.assign(window.stageEngine||{},{
  end: window.hookStageBattleEnd,
});