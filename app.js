// 1. 初始化 Supabase
// 把下面的 '你的Project URL' 替换成你在设置里看到的 URL
const supabaseUrl = 'https://uyvixbgmynvrfbfiewak.supabase.co'; 

// 把下面的 '你的anon Key' 替换成你在设置里看到的 anon public Key
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV5dml4YmdteW52cmZiZmlld2FrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQyMDg5NjcsImV4cCI6MjA3OTc4NDk2N30.vWD3rypscoap9mETCCD7hcEv6Fa8MCzGDEI42L7O3yg'; 

const supabase = supabase.createClient(supabaseUrl, supabaseKey);

// 2. 上传功能
const uploadBtn = document.getElementById('uploadBtn');
uploadBtn.addEventListener('click', async () => {
    const name = document.getElementById('gameName').value;
    const url = document.getElementById('gameUrl').value;

    if(name && url) {
        // 向 'games' 表格插入数据
        const { data, error } = await supabase
            .from('games')
            .insert([
                { name: name, url: url }
            ]);

        if (error) {
            console.error("出错了:", error);
            alert("上传失败：" + error.message);
        } else {
            alert("上传成功！");
            location.reload(); // 刷新页面
        }
    } else {
        alert("请填写完整信息");
    }
});

// 3. 读取并显示功能
async function loadGames() {
    // 从 'games' 表格查找所有数据
    const { data, error } = await supabase
        .from('games')
        .select('*')
        .order('created_at', { ascending: false }); // 按时间倒序排

    if (error) {
        console.log("读取失败:", error);
        return;
    }

    const container = document.getElementById('gamesContainer');
    
    // 遍历数据并显示
    data.forEach((game) => {
        const li = document.createElement('li');
        li.innerHTML = `<strong>${game.name}</strong> - <a href="${game.url}" target="_blank">去玩</a>`;
        container.appendChild(li);
    });
}

// 页面加载时读取游戏
loadGames();
