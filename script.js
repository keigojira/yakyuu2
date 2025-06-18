document.addEventListener('DOMContentLoaded', () => {
    // --- UI Elements ---
    const setupSection = document.getElementById('setup-section');
    const scoreboardSection = document.getElementById('scoreboard-section');
    const historySection = document.getElementById('history-section');

    const awayTeamNameInput = document.getElementById('awayTeamNameInput');
    const homeTeamNameInput = document.getElementById('homeTeamNameInput');
    const playerCountInput = document.getElementById('playerCountInput');
    const awayPlayerSetup = document.getElementById('awayPlayerSetup');
    const homePlayerSetup = document.getElementById('homePlayerSetup');
    const awayPlayersDiv = document.getElementById('awayPlayers');
    const homePlayersDiv = document.getElementById('homePlayers');
    const startGameButton = document.getElementById('startGameButton');

    const awayTeamLabel = document.getElementById('awayTeamLabel');
    const homeTeamLabel = document.getElementById('homeTeamLabel');
    const awayTotalScoreLabel = document.getElementById('awayTotalScore');
    const homeTotalScoreLabel = document.getElementById('homeTotalScore');
    const awayTotalHLabel = document.getElementById('awayTotalH');
    const homeTotalHLabel = document.getElementById('homeTotalH');
    const awayTotalELabel = document.getElementById('awayTotalE');
    const homeTotalELabel = document.getElementById('homeTotalE');
    const awayTeamAvgLabel = document.getElementById('awayTeamAvg');
    const homeTeamAvgLabel = document.getElementById('homeTeamAvg');
    const awayTeamObpLabel = document.getElementById('awayTeamObp');
    const homeTeamObpLabel = document.getElementById('homeTeamObp');


    const currentInningInfo = document.getElementById('currentInningInfo');
    const outsInfo = document.getElementById('outsInfo');
    const ballsInfo = document.getElementById('ballsInfo');
    const strikesInfo = document.getElementById('strikesInfo');

    const firstBase = document.getElementById('firstBase');
    const secondBase = document.getElementById('secondBase');
    const thirdBase = document.getElementById('thirdBase');

    // Controls
    const currentBatterSelect = document.getElementById('currentBatterSelect');
    const batterOutButton = document.getElementById('batterOut');
    const batterSingleButton = document.getElementById('batterSingle');
    const batterDoubleButton = document.getElementById('batterDouble');
    const batterTripleButton = document.getElementById('batterTriple');
    const batterHomeRunButton = document.getElementById('batterHomeRun');
    const batterWalkButton = document.getElementById('batterWalk');
    const batterHBPButton = document.getElementById('batterHBP');
    const batterSacrificeButton = document.getElementById('batterSacrifice');
    const batterErrorButton = document.getElementById('batterError');

    const addRunButton = document.getElementById('addRun');
    const subtractRunButton = document.getElementById('subtractRun');
    const addErrorButton = document.getElementById('addError');
    const subtractErrorButton = document.getElementById('subtractError');

    const clearBasesButton = document.getElementById('clearBases');
    const addBallButton = document.getElementById('addBall');
    const addStrikeButton = document.getElementById('addStrike');
    const resetCountButton = document.getElementById('resetCount');

    const nextInningButton = document.getElementById('nextInning');
    const switchSidesButton = document.getElementById('switchSides');
    const endGameButton = document.getElementById('endGame');
    const resetGameButton = document.getElementById('resetGame');

    const playerStatsSection = document.getElementById('playerStatsSection');
    const awayPlayerStatsTeamName = document.getElementById('awayPlayerStatsTeamName');
    const homePlayerStatsTeamName = document.getElementById('homePlayerStatsTeamName');
    const awayPlayerStatsTableBody = document.querySelector('#awayPlayerStatsTable tbody');
    const homePlayerStatsTableBody = document.querySelector('#homePlayerStatsTable tbody');

    const gameHistoryList = document.getElementById('gameHistoryList');
    const clearHistoryButton = document.getElementById('clearHistoryButton');

    // --- Game State Variables ---
    let currentInning = 1;
    let isTopInning = true; // true: top (away batting), false: bottom (home batting)
    let outs = 0;
    let balls = 0;
    let strikes = 0;
    let bases = [false, false, false]; // [1st, 2nd, 3rd]

    let awayTeamName = "ビジターズ";
    let homeTeamName = "ホームズ";
    let playerCount = 9;

    let totalHits = { [awayTeamName]: 0, [homeTeamName]: 0 };
    let totalErrors = { [awayTeamName]: 0, [homeTeamName]: 0 };

    // Player Stats: Map<string, Player> where Player = {name: string, AB: int, H: int, BB: int, HBP: int, SF_SH: int}
    let awayPlayers = {};
    let homePlayers = {};
    let currentBatterId = null; // ID of the currently selected batter

    // inningScores: Array of objects [{away: score, home: score}, {away: score, home: score}, ...]
    let inningScores = [];
    let gameHistoryLog = []; // Records for the current game session (reset on game end)

    let savedGameResults = []; // Records for all past games (persists in localStorage)

    // --- Utility Functions ---

    function formatAvg(hits, atBats) {
        if (atBats === 0) return '.000';
        return (hits / atBats).toFixed(3).substring(1); // Remove leading '0'
    }

    function formatObp(hits, walks, hbp, atBats, sacrificeFlies) {
        const numerator = hits + walks + hbp;
        const denominator = atBats + walks + hbp + sacrificeFlies;
        if (denominator === 0) return '.000';
        return (numerator / denominator).toFixed(3).substring(1); // Remove leading '0'
    }

    function getActiveTeamPlayers() {
        return isTopInning ? awayPlayers : homePlayers;
    }

    function getActivePlayerStats(playerId) {
        const activePlayers = getActiveTeamPlayers();
        return activePlayers[playerId];
    }

    function getOppositeTeamName() {
        return isTopInning ? homeTeamName : awayTeamName;
    }


    // --- Game Logic Functions ---

    function initializeGame() {
        currentInning = 1;
        isTopInning = true;
        outs = 0;
        balls = 0;
        strikes = 0;
        bases = [false, false, false];
        inningScores = [{ [awayTeamName]: 0, [homeTeamName]: 0 }]; // Initialize first inning score
        totalHits = { [awayTeamName]: 0, [homeTeamName]: 0 };
        totalErrors = { [awayTeamName]: 0, [homeTeamName]: 0 };
        gameHistoryLog = []; // Clear current game history log

        // Initialize player stats
        awayPlayers = {};
        for (let i = 0; i < playerCount; i++) {
            const playerName = document.getElementById(`awayPlayer${i}`).value || `先攻選手${i + 1}`;
            awayPlayers[`away_${i}`] = { name: playerName, AB: 0, H: 0, BB: 0, HBP: 0, SF_SH: 0, E: 0 }; // E for individual player errors if tracking
        }
        homePlayers = {};
        for (let i = 0; i < playerCount; i++) {
            const playerName = document.getElementById(`homePlayer${i}`).value || `後攻選手${i + 1}`;
            homePlayers[`home_${i}`] = { name: playerName, AB: 0, H: 0, BB: 0, HBP: 0, SF_SH: 0, E: 0 };
        }
        currentBatterId = null; // No batter selected initially

        updateUI();
        addGameHistoryLog('試合開始: ' + awayTeamName + ' vs ' + homeTeamName);
        saveGameState(); // Save initial state
    }

    function addRun(count = 1) {
        const team = isTopInning ? awayTeamName : homeTeamName;
        inningScores[currentInning - 1][team] += count;
        updateUI();
        resetPitchCount(); // 得点が入ったらカウントはリセット
        addGameHistoryLog(team + 'が得点しました (' + count + '点).');
        saveGameState();
    }

    function subtractRun(count = 1) {
        const team = isTopInning ? awayTeamName : homeTeamName;
        if (inningScores[currentInning - 1][team] - count >= 0) {
            inningScores[currentInning - 1][team] -= count;
        } else {
            inningScores[currentInning - 1][team] = 0; // 0より下にはならない
        }
        updateUI();
        addGameHistoryLog(team + 'の得点が' + count + '点減りました.');
        saveGameState();
    }

    function addOut() {
        outs++;
        if (outs >= 3) {
            outs = 0;
            resetPitchCount();
            clearBases();
            switchSides();
            addGameHistoryLog('3アウトチェンジ！');
        } else {
            addGameHistoryLog('アウト追加 (' + outs + 'アウト).');
        }
        updateUI();
        saveGameState();
    }

    function subtractOut() {
        if (outs > 0) {
            outs--;
            addGameHistoryLog('アウト削減 (' + outs + 'アウト).');
        }
        updateUI();
        saveGameState();
    }

    function addError() {
        const team = getOppositeTeamName(); // エラーは守備側のチームに記録
        totalErrors[team]++;
        updateUI();
        addGameHistoryLog(team + 'にエラー追加 (' + totalErrors[team] + 'E).');
        saveGameState();
    }

    function subtractError() {
        const team = getOppositeTeamName();
        if (totalErrors[team] > 0) {
            totalErrors[team]--;
        }
        updateUI();
        addGameHistoryLog(team + 'のエラー削減 (' + totalErrors[team] + 'E).');
        saveGameState();
    }

    function addBall() {
        balls++;
        if (balls >= 4) {
            // 四球の場合、打席数には数えず、四球として記録
            if (currentBatterId) {
                const player = getActivePlayerStats(currentBatterId);
                player.BB++;
                addGameHistoryLog(player.name + 'が四球を選びました。');
            }
            balls = 0;
            strikes = 0;
            advanceRunners(0); // 0は四球を表す
        } else {
            addGameHistoryLog('ボール追加 (' + balls + 'B).');
        }
        updateUI();
        saveGameState();
    }

    function addStrike() {
        strikes++;
        if (strikes >= 3) {
            // 三振の場合、打席数にカウントし、安打はなし
            if (currentBatterId) {
                const player = getActivePlayerStats(currentBatterId);
                player.AB++; // 三振は打席数に含める
                addGameHistoryLog(player.name + 'が三振！');
            }
            strikes = 0;
            balls = 0;
            addOut(); // 三振
        } else {
            addGameHistoryLog('ストライク追加 (' + strikes + 'S).');
        }
        updateUI();
        saveGameState();
    }

    function resetPitchCount() {
        balls = 0;
        strikes = 0;
        updateUI();
        addGameHistoryLog('カウントリセット.');
        saveGameState();
    }

    function clearBases() {
        bases = [false, false, false];
        updateUI();
        addGameHistoryLog('塁上クリア.');
        saveGameState();
    }

    /**
     * @param {number} hitType 0=walk, 1=single, 2=double, 3=triple, 4=homeRun, 5=HBP, 6=Sacrifice, 7=ErrorOut
     */
    function advanceRunners(hitType) {
        if (currentBatterId) {
            const player = getActivePlayerStats(currentBatterId);

            if (hitType === 1 || hitType === 2 || hitType === 3 || hitType === 4) { // Hits
                player.AB++;
                player.H++;
                totalHits[isTopInning ? awayTeamName : homeTeamName]++;
            } else if (hitType === 0) { // Walk
                // player.BB++; handled in addBall
                // player.AB++; // BBはABに含めない (出塁率計算のため)
            } else if (hitType === 5) { // HBP
                player.HBP++;
            } else if (hitType === 6) { // Sacrifice
                player.SF_SH++;
                // ABには含めないが、アウトは取るので別途 addOut を呼ぶ
            } else if (hitType === 7) { // Reached on Error (ErrorOut: not AB, not H, but advances)
                // Do not increment AB for batter
            } else { // Out (handled by batterOut or addOut)
                player.AB++;
            }
        }

        let runsScored = 0;
        let batterToScore = false; // Flag for batter's own run

        // Runners already on base
        if (bases[2]) { // 3rd base runner
            runsScored++;
        }
        if (bases[1]) { // 2nd base runner
            bases[2] = true;
        } else {
            bases[2] = false;
        }
        if (bases[0]) { // 1st base runner
            bases[1] = true;
        } else {
            bases[1] = false;
        }
        bases[0] = false; // Clear 1st base temporarily for batter or forced runner

        // Handle the batter or new runner
        if (hitType === 1 || hitType === 0 || hitType === 5 || hitType === 7) { // Single, Walk, HBP, ErrorOut
            bases[0] = true;
        } else if (hitType === 2) { // Double
            bases[1] = true;
        } else if (hitType === 3) { // Triple
            bases[2] = true;
        } else if (hitType === 4) { // Home Run
            runsScored += (bases[0] ? 1 : 0) + (bases[1] ? 1 : 0) + (bases[2] ? 1 : 0); // Previous runners score
            batterToScore = true; // Batter scores
            clearBases(); // All bases clear after HR
        }

        if (batterToScore) {
            runsScored++;
        }

        if (runsScored > 0) {
            addRun(runsScored); // Add score for all runs
            addGameHistoryLog('得点！' + runsScored + '点追加！');
        }
        resetPitchCount(); // 打席結果が出たらカウントリセット
        updateUI();
        saveGameState();
    }

    // Direct actions for batter
    function recordBatterOut() {
        if (currentBatterId) {
            const player = getActivePlayerStats(currentBatterId);
            player.AB++;
            addGameHistoryLog(player.name + 'がアウトになりました。');
        }
        addOut();
    }
    function recordBatterHit(hitType) {
        advanceRunners(hitType);
        if (currentBatterId) {
            addGameHistoryLog(getActivePlayerStats(currentBatterId).name + 'が' + (hitType === 1 ? '単打' : hitType === 2 ? '二塁打' : hitType === 3 ? '三塁打' : '本塁打') + 'を打ちました。');
        }
    }
    function recordBatterWalk() {
        if (currentBatterId) {
            const player = getActivePlayerStats(currentBatterId);
            player.BB++;
            addGameHistoryLog(player.name + 'が四球を選びました。');
        }
        resetPitchCount();
        advanceRunners(0); // 0 for walk
    }
    function recordBatterHBP() {
        if (currentBatterId) {
            const player = getActivePlayerStats(currentBatterId);
            player.HBP++;
            addGameHistoryLog(player.name + 'が死球を受けました。');
        }
        resetPitchCount();
        advanceRunners(5); // 5 for HBP
    }
    function recordBatterSacrifice() {
        if (currentBatterId) {
            const player = getActivePlayerStats(currentBatterId);
            player.SF_SH++;
            addGameHistoryLog(player.name + 'が犠牲打/犠牲飛を記録しました。');
        }
        resetPitchCount();
        addOut(); // Sacrifice always results in an out
        // Runners advance only by explicit addRun/advanceRunners if applicable
    }
    function recordBatterError() {
        if (currentBatterId) {
            addGameHistoryLog(getActivePlayerStats(currentBatterId).name + 'が相手失策で出塁しました。');
        }
        totalErrors[getOppositeTeamName()]++; // Record error for the fielding team
        resetPitchCount();
        advanceRunners(7); // 7 for Reached on Error
    }


    function switchSides() {
        isTopInning = !isTopInning;
        if (isTopInning) { // 攻守交代後、表イニングになったらイニングを進める
            currentInning++;
            // 新しいイニングのスコアを初期化
            if (!inningScores[currentInning - 1]) {
                inningScores.push({ [awayTeamName]: 0, [homeTeamName]: 0 });
            }
        }
        outs = 0;
        balls = 0;
        strikes = 0;
        clearBases();
        currentBatterId = null; // batter needs to be re-selected for new inning/side
        updateUI();
        addGameHistoryLog('攻守交代: ' + currentInning + '回' + (isTopInning ? '表' : '裏'));
        saveGameState();
    }

    function nextInning() {
        if (!isTopInning) { // 現在裏イニングの場合のみ、次のイニングの表へ進む
            currentInning++;
            isTopInning = true;
            if (!inningScores[currentInning - 1]) {
                inningScores.push({ [awayTeamName]: 0, [homeTeamName]: 0 });
            }
        } else { // 現在表イニングの場合、裏イニングへ進む
            isTopInning = false;
        }
        outs = 0;
        balls = 0;
        strikes = 0;
        clearBases();
        currentBatterId = null; // batter needs to be re-selected for new inning/side
        updateUI();
        addGameHistoryLog('イニング変更: ' + currentInning + '回' + (isTopInning ? '表' : '裏'));
        saveGameState();
    }

    function endGame() {
        const confirmEnd = confirm("試合を終了しますか？");
        if (!confirmEnd) return;

        const awayTotal = calculateTotalScore(awayTeamName);
        const homeTotal = calculateTotalScore(homeTeamName);
        const result = `${awayTeamName}: ${awayTotal} - ${homeTeamName}: ${homeTotal}`;
        const winner = awayTotal > homeTotal ? awayTeamName : (homeTotal > awayTotal ? homeTeamName ? '引き分け' : '引き分け');

        const gameResult = {
            date: new Date().toLocaleString(),
            awayTeam: awayTeamName,
            homeTeam: homeTeamName,
            awayScore: awayTotal,
            homeScore: homeTotal,
            awayHits: totalHits[awayTeamName],
            homeHits: totalHits[homeTeamName],
            awayErrors: totalErrors[awayTeamName],
            homeErrors: totalErrors[homeTeamName],
            winner: winner,
            details: JSON.parse(JSON.stringify(inningScores)), // ディープコピー
            awayPlayersStats: JSON.parse(JSON.stringify(awayPlayers)),
            homePlayersStats: JSON.parse(JSON.stringify(homePlayers))
        };
        savedGameResults.push(gameResult);
        saveGameResults();
        addGameHistoryLog('試合終了: ' + result + ' (' + winner + 'の勝利)');

        alert("試合が終了しました。\n最終スコア: " + result);

        // 試合終了後のUI表示
        setupSection.classList.remove('hidden');
        scoreboardSection.classList.add('hidden');
        historySection.classList.remove('hidden'); // 履歴セクションを表示
        displayGameResults(); // 履歴を更新
        resetGame(false); // 履歴には残すが、現在のスコアボードはリセット
    }

    function resetGame(confirmReset = true) {
        if (confirmReset && !confirm("現在の試合をリセットしますか？この操作は取り消せません。")) {
            return;
        }
        awayTeamName = awayTeamNameInput.value || "ビジターズ";
        homeTeamName = homeTeamNameInput.value || "ホームズ";
        playerCount = parseInt(playerCountInput.value, 10);
        initializeGame();
        saveGameState(); // Reset state
    }

    // --- UI Update Functions ---

    function updateUI() {
        // Update Team Names
        awayTeamLabel.textContent = awayTeamName;
        homeTeamLabel.textContent = homeTeamName;

        // Update Inning Info
        currentInningInfo.textContent = `${currentInning}回${isTopInning ? '表' : '裏'}`;
        outsInfo.textContent = `O: ${outs}`;
        ballsInfo.textContent = `B: ${balls}`;
        strikesInfo.textContent = `S: ${strikes}`;

        // Update Bases
        firstBase.classList.toggle('active', bases[0]);
        secondBase.classList.toggle('active', bases[1]);
        thirdBase.classList.toggle('active', bases[2]);

        // Update Total Hits and Errors
        awayTotalHLabel.textContent = totalHits[awayTeamName];
        homeTotalHLabel.textContent = totalHits[homeTeamName];
        awayTotalELabel.textContent = totalErrors[awayTeamName];
        homeTotalELabel.textContent = totalErrors[homeTeamName];

        // Update Team AVG and OBP
        updateTeamStats();

        // Update Scores and Totals
        updateScoreboardTable();

        // Update Batter Select dropdown
        updateBatterSelect();

        // Update Player Stats Tables
        updatePlayerStatsTables();
    }

    function updateTeamStats() {
        const awayBatters = Object.values(awayPlayers);
        const homeBatters = Object.values(homePlayers);

        let awayTeamHits = awayBatters.reduce((sum, p) => sum + p.H, 0);
        let awayTeamAB = awayBatters.reduce((sum, p) => sum + p.AB, 0);
        let awayTeamBB = awayBatters.reduce((sum, p) => sum + p.BB, 0);
        let awayTeamHBP = awayBatters.reduce((sum, p) => sum + p.HBP, 0);
        let awayTeamSF_SH = awayBatters.reduce((sum, p) => sum + p.SF_SH, 0);

        let homeTeamHits = homeBatters.reduce((sum, p) => sum + p.H, 0);
        let homeTeamAB = homeBatters.reduce((sum, p) => sum + p.AB, 0);
        let homeTeamBB = homeBatters.reduce((sum, p) => sum + p.BB, 0);
        let homeTeamHBP = homeBatters.reduce((sum, p) => sum + p.HBP, 0);
        let homeTeamSF_SH = homeBatters.reduce((sum, p) => sum + p.SF_SH, 0);

        awayTeamAvgLabel.textContent = formatAvg(awayTeamHits, awayTeamAB);
        awayTeamObpLabel.textContent = formatObp(awayTeamHits, awayTeamBB, awayTeamHBP, awayTeamAB, awayTeamSF_SH);
        homeTeamAvgLabel.textContent = formatAvg(homeTeamHits, homeTeamAB);
        homeTeamObpLabel.textContent = formatObp(homeTeamHits, homeTeamBB, homeTeamHBP, homeTeamAB, homeTeamSF_SH);
    }


    function updateScoreboardTable() {
        const scoreboardDiv = document.querySelector('.scoreboard');
        const awayTeamRow = document.querySelector('.away-team');
        const homeTeamRow = document.querySelector('.home-team');

        // Remove old inning score cells (keep team label and RHE/AVG/OBP placeholders)
        awayTeamRow.querySelectorAll('.inning-score').forEach(el => el.remove());
        homeTeamRow.querySelectorAll('.inning-score').forEach(el => el.remove());

        // Ensure enough inning columns in header
        const header = document.querySelector('.scoreboard-header');
        // Calculate current number of inning columns + team label + RHEAVGOBP
        const currentHeaderCols = header.children.length;
        const fixedCols = 1 + 5; // team-label + RHEAVGOBP (5 columns)
        const currentInningCols = currentHeaderCols - fixedCols;

        for (let i = currentInningCols; i < currentInning; i++) {
            if (i < 9) { // Default 9 innings are already there
                // Do nothing if it's one of the first 9 innings and exists
            } else { // Add new inning header if beyond 9th inning
                const newInningHeader = document.createElement('div');
                newInningHeader.classList.add('inning-col');
                newInningHeader.textContent = i + 1;
                // Insert before RHEAVGOBP columns (there are 5 fixed columns at the end)
                header.insertBefore(newInningHeader, header.children[header.children.length - 5]);
            }
        }

        let awayTotal = 0;
        let homeTotal = 0;

        inningScores.forEach((inning, index) => {
            const awayInningScore = inning[awayTeamName] || 0;
            const homeInningScore = inning[homeTeamName] || 0;

            awayTotal += awayInningScore;
            homeTotal += homeInningScore;

            // Create and append score for away team
            const awayScoreDiv = document.createElement('div');
            awayScoreDiv.classList.add('inning-score');
            awayScoreDiv.textContent = awayInningScore;
            // Insert after team label and previous innings (account for the initial team label div)
            awayTeamRow.insertBefore(awayScoreDiv, awayTeamRow.children[1 + index]);

            // Create and append score for home team
            const homeScoreDiv = document.createElement('div');
            homeScoreDiv.classList.add('inning-score');
            homeScoreDiv.textContent = homeInningScore;
            homeTeamRow.insertBefore(homeScoreDiv, homeTeamRow.children[1 + index]);
        });

        awayTotalScoreLabel.textContent = awayTotal;
        homeTotalScoreLabel.textContent = homeTotal;
    }

    function createPlayerInputFields(containerDiv, teamPrefix, numPlayers) {
        containerDiv.innerHTML = '';
        for (let i = 0; i < numPlayers; i++) {
            const div = document.createElement('div');
            div.classList.add('player-input-group');
            div.innerHTML = `
                <label for="${teamPrefix}Player${i}">${i + 1}.</label>
                <input type="text" id="${teamPrefix}Player${i}" value="${teamPrefix === 'away' ? 'ビジターズ' : 'ホームズ'}選手${i + 1}">
            `;
            containerDiv.appendChild(div);
        }
    }

    function updateBatterSelect() {
        currentBatterSelect.innerHTML = '';
        const battingPlayers = isTopInning ? awayPlayers : homePlayers;

        const defaultOption = document.createElement('option');
        defaultOption.value = "";
        defaultOption.textContent = "打者を選択...";
        currentBatterSelect.appendChild(defaultOption);

        for (const playerId in battingPlayers) {
            const player = battingPlayers[playerId];
            const option = document.createElement('option');
            option.value = playerId;
            option.textContent = player.name;
            currentBatterSelect.appendChild(option);
        }

        // Restore selected batter if applicable
        if (currentBatterId && battingPlayers[currentBatterId]) {
            currentBatterSelect.value = currentBatterId;
        } else {
            currentBatterSelect.value = ""; // Clear selection if old batter not available
            currentBatterId = null;
        }
    }

    function updatePlayerStatsTables() {
        awayPlayerStatsTeamName.textContent = awayTeamName;
        homePlayerStatsTeamName.textContent = homeTeamName;

        awayPlayerStatsTableBody.innerHTML = '';
        Object.values(awayPlayers).forEach((player, index) => {
            const row = awayPlayerStatsTableBody.insertRow();
            row.innerHTML = `
                <td>${index + 1}</td>
                <td>${player.name}</td>
                <td>${player.AB}</td>
                <td>${player.H}</td>
                <td>${player.BB}</td>
                <td>${player.HBP}</td>
                <td>${player.SF_SH}</td>
                <td>${formatAvg(player.H, player.AB)}</td>
                <td>${formatObp(player.H, player.BB, player.HBP, player.AB, player.SF_SH)}</td>
            `;
        });

        homePlayerStatsTableBody.innerHTML = '';
        Object.values(homePlayers).forEach((player, index) => {
            const row = homePlayerStatsTableBody.insertRow();
            row.innerHTML = `
                <td>${index + 1}</td>
                <td>${player.name}</td>
                <td>${player.AB}</td>
                <td>${player.H}</td>
                <td>${player.BB}</td>
                <td>${player.HBP}</td>
                <td>${player.SF_SH}</td>
                <td>${formatAvg(player.H, player.AB)}</td>
                <td>${formatObp(player.H, player.BB, player.HBP, player.AB, player.SF_SH)}</td>
            `;
        });
    }


    function addGameHistoryLog(action) {
        const timestamp = new Date().toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' });
        gameHistoryLog.unshift(`[${timestamp}] ${action}`); // Add to the beginning
        // If you want to display this log live during game, add a div for it.
        // For now, it's just for internal game state and saving.
    }


    function displayGameResults() {
        gameHistoryList.innerHTML = ''; // Clear previous history
        if (savedGameResults.length === 0) {
            const li = document.createElement('li');
            li.textContent = 'まだ試合の履歴がありません。';
            gameHistoryList.appendChild(li);
            return;
        }

        savedGameResults.forEach(game => {
            const li = document.createElement('li');
            li.innerHTML = `
                <strong>${game.date}</strong><br>
                ${game.awayTeam}: ${game.awayScore} - ${game.homeTeam}: ${game.homeScore}<br>
                (H: ${game.awayHits} E: ${game.awayErrors}) - (H: ${game.homeHits} E: ${game.homeErrors})<br>
                勝者: ${game.winner}<br>
                <button class="view-details-button" data-game-index="${savedGameResults.indexOf(game)}">詳細を見る</button>
                <div class="game-details-content hidden"></div>
            `;
            gameHistoryList.appendChild(li);
        });

        // Add event listeners for "詳細を見る" buttons
        document.querySelectorAll('.view-details-button').forEach(button => {
            button.addEventListener('click', (event) => {
                const gameIndex = parseInt(event.target.dataset.gameIndex, 10);
                const game = savedGameResults[gameIndex];
                const detailsDiv = event.target.nextElementSibling; // The hidden div
                
                if (detailsDiv.classList.contains('hidden')) {
                    detailsDiv.innerHTML = formatGameDetails(game);
                    detailsDiv.classList.remove('hidden');
                    event.target.textContent = '詳細を隠す';
                } else {
                    detailsDiv.classList.add('hidden');
                    detailsDiv.innerHTML = ''; // Clear content when hidden
                    event.target.textContent = '詳細を見る';
                }
            });
        });
    }

    function formatGameDetails(game) {
        let detailsHtml = '<h4>イニングごとのスコア:</h4>';
        detailsHtml += '<table class="history-inning-table"><thead><tr><th>チーム</th>';
        for(let i = 0; i < game.details.length; i++) {
            detailsHtml += `<th>${i + 1}</th>`;
        }
        detailsHtml += '</tr></thead><tbody>';
        detailsHtml += `<tr><td>${game.awayTeam}</td>`;
        game.details.forEach(inning => detailsHtml += `<td>${inning[game.awayTeam] || 0}</td>`);
        detailsHtml += '</tr>';
        detailsHtml += `<tr><td>${game.homeTeam}</td>`;
        game.details.forEach(inning => detailsHtml += `<td>${inning[game.homeTeam] || 0}</td>`);
        detailsHtml += '</tr></tbody></table>';

        detailsHtml += '<h4>選手スタッツ:</h4>';
        detailsHtml += `<h5>${game.awayTeam}</h5>`;
        detailsHtml += renderPlayerStatsTableHtml(game.awayPlayersStats);
        detailsHtml += `<h5>${game.homeTeam}</h5>`;
        detailsHtml += renderPlayerStatsTableHtml(game.homePlayersStats);

        return detailsHtml;
    }

    function renderPlayerStatsTableHtml(playersStats) {
        let html = '<table class="history-player-stats-table"><thead><tr><th>#</th><th>選手名</th><th>AB</th><th>H</th><th>BB</th><th>HBP</th><th>SF/SH</th><th>AVG</th><th>OBP</th></tr></thead><tbody>';
        let index = 1;
        for (const playerId in playersStats) {
            const player = playersStats[playerId];
            html += `<tr>
                <td>${index++}</td>
                <td>${player.name}</td>
                <td>${player.AB}</td>
                <td>${player.H}</td>
                <td>${player.BB}</td>
                <td>${player.HBP}</td>
                <td>${player.SF_SH}</td>
                <td>${formatAvg(player.H, player.AB)}</td>
                <td>${formatObp(player.H, player.BB, player.HBP, player.AB, player.SF_SH)}</td>
            </tr>`;
        }
        html += '</tbody></table>';
        return html;
    }


    function calculateTotalScore(teamName) {
        return inningScores.reduce((total, inning) => total + (inning[teamName] || 0), 0);
    }

    // --- Local Storage Functions ---

    function saveGameState() {
        const state = {
            currentInning,
            isTopInning,
            outs,
            balls,
            strikes,
            bases,
            awayTeamName,
            homeTeamName,
            playerCount,
            totalHits,
            totalErrors,
            awayPlayers,
            homePlayers,
            currentBatterId,
            inningScores,
            gameHistoryLog
        };
        localStorage.setItem('baseballScoreboardCurrentGame', JSON.stringify(state));
    }

    function loadGameState() {
        const savedState = localStorage.getItem('baseballScoreboardCurrentGame');
        if (savedState) {
            const state = JSON.parse(savedState);
            currentInning = state.currentInning;
            isTopInning = state.isTopInning;
            outs = state.outs;
            balls = state.balls;
            strikes = state.strikes;
            bases = state.bases;
            awayTeamName = state.awayTeamName;
            homeTeamName = state.homeTeamName;
            playerCount = state.playerCount || 9; // Default to 9 if not saved
            totalHits = state.totalHits;
            totalErrors = state.totalErrors;
            awayPlayers = state.awayPlayers;
            homePlayers = state.homePlayers;
            currentBatterId = state.currentBatterId;
            inningScores = state.inningScores;
            gameHistoryLog = state.gameHistoryLog || [];

            // Update input fields with loaded values
            awayTeamNameInput.value = awayTeamName;
            homeTeamNameInput.value = homeTeamName;
            playerCountInput.value = playerCount;

            // Recreate player input fields in setup section if needed (though they are hidden)
            createPlayerInputFields(awayPlayersDiv, 'away', playerCount);
            createPlayerInputFields(homePlayersDiv, 'home', playerCount);
            // And populate with loaded names
            for(const id in awayPlayers) {
                const input = document.getElementById(id.replace('_', 'Player'));
                if (input) input.value = awayPlayers[id].name;
            }
            for(const id in homePlayers) {
                const input = document.getElementById(id.replace('_', 'Player'));
                if (input) input.value = homePlayers[id].name;
            }


            // Show scoreboard if game was active
            setupSection.classList.add('hidden');
            scoreboardSection.classList.remove('hidden');
            historySection.classList.add('hidden'); // Initially hide history when game is active

            updateUI();
        } else {
            // No saved game, show setup section
            setupSection.classList.remove('hidden');
            scoreboardSection.classList.add('hidden');
            historySection.classList.add('hidden');
            // Initialize player input fields based on default playerCount
            createPlayerInputFields(awayPlayersDiv, 'away', parseInt(playerCountInput.value, 10));
            createPlayerInputFields(homePlayersDiv, 'home', parseInt(playerCountInput.value, 10));
        }
    }

    function saveGameResults() {
        localStorage.setItem('baseballScoreboardGameResults', JSON.stringify(savedGameResults));
    }

    function loadGameResults() {
        const results = localStorage.getItem('baseballScoreboardGameResults');
        if (results) {
            savedGameResults = JSON.parse(results);
        }
        displayGameResults();
    }

    function clearGameHistory() {
        if (confirm("全ての試合履歴をクリアしますか？この操作は元に戻せません。")) {
            localStorage.removeItem('baseballScoreboardGameResults');
            savedGameResults = [];
            displayGameResults();
            alert("試合履歴がクリアされました。");
        }
    }

    // --- Event Listeners ---

    playerCountInput.addEventListener('change', () => {
        playerCount = parseInt(playerCountInput.value, 10);
        if (isNaN(playerCount) || playerCount < 1) {
            playerCount = 1;
            playerCountInput.value = 1;
        } else if (playerCount > 25) {
            playerCount = 25;
            playerCountInput.value = 25;
        }
        createPlayerInputFields(awayPlayersDiv, 'away', playerCount);
        createPlayerInputFields(homePlayersDiv, 'home', playerCount);
    });

    startGameButton.addEventListener('click', () => {
        awayTeamName = awayTeamNameInput.value || "ビジターズ";
        homeTeamName = homeTeamNameInput.value || "ホームズ";
        playerCount = parseInt(playerCountInput.value, 10); // Ensure playerCount is updated
        initializeGame();
        setupSection.classList.add('hidden');
        scoreboardSection.classList.remove('hidden');
        historySection.classList.add('hidden');
    });

    currentBatterSelect.addEventListener('change', (event) => {
        currentBatterId = event.target.value;
        if (currentBatterId === "") {
            console.log("打者が選択されていません。");
        } else {
            const player = getActivePlayerStats(currentBatterId);
            console.log("選択された打者: ", player.name);
        }
    });

    // Batting action buttons
    batterOutButton.addEventListener('click', recordBatterOut);
    batterSingleButton.addEventListener('click', () => recordBatterHit(1));
    batterDoubleButton.addEventListener('click', () => recordBatterHit(2));
    batterTripleButton.addEventListener('click', () => recordBatterHit(3));
    batterHomeRunButton.addEventListener('click', () => recordBatterHit(4));
    batterWalkButton.addEventListener('click', recordBatterWalk);
    batterHBPButton.addEventListener('click', recordBatterHBP);
    batterSacrificeButton.addEventListener('click', recordBatterSacrifice);
    batterErrorButton.addEventListener('click', recordBatterError);


    // Manual score/error adjustments
    addRunButton.addEventListener('click', () => addRun());
    subtractRunButton.addEventListener('click', () => subtractRun());
    addErrorButton.addEventListener('click', () => addError());
    subtractErrorButton.addEventListener('click', () => subtractError());

    // Base/Count controls
    clearBasesButton.addEventListener('click', () => clearBases());
    addBallButton.addEventListener('click', () => addBall());
    addStrikeButton.addEventListener('click', () => addStrike());
    resetCountButton.addEventListener('click', () => resetPitchCount());

    // Inning/Game controls
    nextInningButton.addEventListener('click', () => nextInning());
    switchSidesButton.addEventListener('click', () => switchSides());
    endGameButton.addEventListener('click', () => endGame());
    resetGameButton.addEventListener('click', () => resetGame());

    clearHistoryButton.addEventListener('click', clearGameHistory);

    // --- Initial Load ---
    // Initialize player input fields based on default playerCount on first load
    createPlayerInputFields(awayPlayersDiv, 'away', parseInt(playerCountInput.value, 10));
    createPlayerInputFields(homePlayersDiv, 'home', parseInt(playerCountInput.value, 10));

    loadGameState(); // Attempt to load ongoing game
    loadGameResults(); // Load past game results
});
