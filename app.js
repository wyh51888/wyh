// 1. 初始化 Supabase
const supabaseUrl = 'https://你的URL.supabase.co'; // 替换你的 URL
const supabaseKey = '你的anon_Key'; // 替换你的 Key

// 【关键修复】使用 window.supabase 来访问库，并赋值给 db (database) 避免名字冲突
const db = window.supabase.createClient(supabaseUrl, supabaseKey);

const uploadBtn = document.getElementById('uploadBtn');
const gamesGrid = document.getElementById('gamesGrid');

// 2. 上传功能的全新逻辑
uploadBtn.addEventListener('click', async () => {
    const nameInput = document.getElementById('gameName');
    const fileInput = document.getElementById('gameFile');
    const file = fileInput.files[0]; 
    const name = nameInput.value;

    if (!name || !file) {
        alert("请填写名字并选择一个 HTML 文件！");
        return;
    }

    uploadBtn.textContent = "正在上传...";
    uploadBtn.disabled = true;

    try {
        const fileName = `${Date.now()}_${file.name}`;

        // 【关键修复】这里用 db 而不是 supabase
        const { data: uploadData, error: uploadError } = await db
            .storage
            .from('game-files')
            .upload(fileName, file);

        if (uploadError) throw uploadError;

        // 【关键修复】这里用 db
        const { data: urlData } = db
            .storage
            .from('game-files')
            .getPublicUrl(fileName);
            
        const publicUrl = urlData.publicUrl;

        // 【关键修复】这里用 db
        const { error: dbError } = await db
            .from('games')
            .insert([
                { name: name, url: publicUrl }
            ]);

        if (dbError) throw dbError;

        alert("发布成功！");
        location.reload();

    } catch (error) {
        console.error("出错了:", error);
        alert("上传失败：" + error.message);
        uploadBtn.textContent = "发布游戏"; 
        uploadBtn.disabled = false;
    }
});

// 3. 读取并显示
async function loadGames() {
    // 【关键修复】这里用 db
    const { data, error } = await db
        .from('games')
        .select('*')
        .order('created_at', { ascending: false });

    if (error) {
        console.log("读取失败:", error);
        return;
    }

    gamesGrid.innerHTML = ''; 

    data.forEach((game) => {
        const card = document.createElement('div');
        card.className = 'game-card';
        card.innerHTML = `
            <div class="game-icon">🎮</div>
            <div class="game-title">${game.name}</div>
            <a href="${game.url}" target="_blank" class="play-btn">开始游玩</a>
        `;
        gamesGrid.appendChild(card);
    });
}

loadGames();
