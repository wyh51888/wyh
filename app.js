// 1. 初始化 (⚠️ 记得填你自己的 URL 和 Key)
const supabaseUrl = 'https://你的URL.supabase.co'; 
const supabaseKey = '你的anon_Key'; 

const db = window.supabase.createClient(supabaseUrl, supabaseKey);
const uploadBtn = document.getElementById('uploadBtn');
const gamesGrid = document.getElementById('gamesGrid');

// 2. 上传逻辑 (保持不变，略微精简)
if (uploadBtn) {
    uploadBtn.addEventListener('click', async () => {
        const nameInput = document.getElementById('gameName');
        const fileInput = document.getElementById('gameFile');
        
        if (!nameInput.value || !fileInput.files[0]) {
            alert("⚠️ ERROR: Missing Input Data");
            return;
        }

        uploadBtn.textContent = "UPLOADING...";
        uploadBtn.disabled = true;

        try {
            const safeName = `${Date.now()}_game.html`;
            const newFile = new File([fileInput.files[0]], safeName, { type: 'text/html;charset=utf-8' });

            const { error: upErr } = await db.storage.from('game-files').upload(safeName, newFile);
            if (upErr) throw upErr;

            const { data: urlData } = db.storage.from('game-files').getPublicUrl(safeName);
            
            // 初始点赞数为 0
            const { error: dbErr } = await db.from('games').insert([
                { name: nameInput.value, url: urlData.publicUrl, likes: 0 }
            ]);

            if (dbErr) throw dbErr;

            alert("✅ DEPLOYMENT SUCCESSFUL");
            location.reload();
        } catch (error) {
            console.error(error);
            alert("❌ FAILED: " + error.message);
            uploadBtn.textContent = "DEPLOY GAME"; 
            uploadBtn.disabled = false;
        }
    });
}

// 3. 核心逻辑：加载、排序、点赞
async function loadGames() {
    if (!gamesGrid) return;

    // 🔥 关键修改：按 likes 倒序排列 (点赞多的在前面)
    const { data, error } = await db
        .from('games') 
        .select('*')
        .order('likes', { ascending: false }); // false = 降序

    if (error) return;

    gamesGrid.innerHTML = ''; 

    data.forEach((game, index) => {
        const card = document.createElement('div');
        card.className = 'game-card';
        
        // 检查本地是否点赞过
        const isLiked = localStorage.getItem(`liked_${game.id}`);

        // --- 启动游戏逻辑 ---
        const handlePlay = async (e) => {
            // ... (保持之前的万能中转逻辑不变) ...
            const btn = e.target;
            btn.innerText = "🚀 LOADING...";
            try {
                const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(game.url)}`;
                const response = await fetch(proxyUrl);
                const blob = await response.blob();
                const htmlBlob = new Blob([blob], { type: 'text/html' }); 
                window.open(URL.createObjectURL(htmlBlob), '_blank');
            } catch (err) {
                window.open(game.url, '_blank');
            } finally {
                btn.innerText = "START GAME";
            }
        };

        // --- 🔥 点赞逻辑 ---
        const handleLike = async (e) => {
            const likeBtn = e.currentTarget;
            const countSpan = likeBtn.querySelector('.count');
            
            // 1. 防刷检查
            if (localStorage.getItem(`liked_${game.id}`)) {
                alert("⛔ 你已经投过票了 (You already voted)");
                return;
            }

            // 2. 乐观更新 UI (先变数字，让用户感觉快)
            let newCount = (game.likes || 0) + 1;
            countSpan.innerText = newCount;
            likeBtn.classList.add('liked');

            // 3. 调用 Supabase 函数更新数据库
            // 使用 rpc 调用我们在 SQL 里写的 increment_likes 函数
            const { error } = await db.rpc('increment_likes', { row_id: game.id });

            if (error) {
                console.error(error);
                alert("Vote failed");
                // 回滚 UI
                countSpan.innerText = game.likes;
                likeBtn.classList.remove('liked');
            } else {
                // 4. 记录到本地，防止重复点赞
                localStorage.setItem(`liked_${game.id}`, 'true');
            }
        };

        // 渲染卡片 HTML
        card.innerHTML = `
            <div class="rank-badge">#${index + 1}</div>
            <div class="game-icon">👾</div>
            <div class="game-title">${game.name}</div>
            <div class="card-actions">
                <button class="play-btn">START GAME</button>
                <button class="like-btn ${isLiked ? 'liked' : ''}">
                    <span>❤️</span> 
                    <span class="count">${game.likes || 0}</span>
                </button>
            </div>
        `;
        
        // 绑定事件
        card.querySelector('.play-btn').onclick = handlePlay;
        card.querySelector('.like-btn').onclick = handleLike;
        
        gamesGrid.appendChild(card);
    });
}

loadGames();
