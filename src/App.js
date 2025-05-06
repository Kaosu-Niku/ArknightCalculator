import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap/dist/js/bootstrap.bundle.min.js';
import './App.css';
import Header from './component/Header.js';
import MainContent from './component/MainContent.js';
import Footer from './component/Footer.js';

function App() {
  return (
    <div>
      <header>
        <title>Arknight Calculator</title>
        <link rel="icon" href="圖片URL" type="image/x-icon"></link>
        <meta charset="UTF-8"></meta>
        <meta name="author" content="Kaosu-Niku"></meta>
        {/* 響應式設計 */}
        <meta name="viewport" content="width=device-width, initial-scale=1.0"></meta>
        {/* 用於搜索引擎結果顯示的網站敘述 */}
        <meta name="description" content="用於明日方舟的以下流派: ( 精一1級四星隊、精一滿級四星隊、四星隊 ) 的數據計算器，可以自定義敵人數據並快速計算我方DPS、敵方DPS...等等數據，方便攻略"></meta>
        {/* 搜索引擎相關設定，index = 允許搜索引擎搜索到此網站，follow = 不允許搜索引擎追蹤此網站上的其餘URL */}
        <meta name="robots" content="index, nofollow"></meta>
        {/* 於社群媒體上分享此網站時的資訊設定 (Open Graph) */}
        <meta property="og:url" content="https://kaosu-niku.github.io/ArknightCalculator/"></meta>  
        <meta property="og:type" content="website"></meta>
        <meta property="og:site_name" content="Arknight Calculator"></meta>
        <meta property="og:image" content="圖片URL"></meta>
        <meta property="og:title" content="明日方舟數據計算器"></meta>
        <meta property="og:description" content="用於明日方舟的以下流派: ( 精一1級四星隊、精一滿級四星隊、四星隊 ) 的數據計算器，可以自定義敵人數據並快速計算我方DPS、敵方DPS...等等數據，方便攻略"></meta>
      </header>
      <Header />
      <MainContent />
      <Footer />
      {/* 電腦版呈現在右邊的的固定按鈕 */}
      <div className="d-none d-md-block position-fixed" style={{ top: '15%', right: '-10px' }}>
        <div className='d-flex flex-column gap-2'>
          <a className="btn btn-danger" href='#enemy_form'>EnemyData</a>
          <a className="btn btn-success" href='#member_table'>MemberData</a>
          <a className="btn btn-warning" href='#attackSkill_table'>AttackSkillData</a>
          <a className="btn btn-primary" href='#defSkill_table'>DefSkillData</a>
        </div>
      </div>
      {/* 手機版呈現在底部的的固定按鈕 */}
      <div className="d-block d-md-none position-fixed" style={{ bottom: '0' }}>
        <div className='row justify-content-around justify-content-center m-0'>
          <a className="col-6 p-0 rounded-0 btn btn-danger" href='#enemy_form'>EnemyData</a>
          <a className="col-6 p-0 rounded-0 btn btn-success" href='#member_table'>MemberData</a>
          <a className="col-6 p-0 rounded-0 btn btn-warning" href='#attackSkill_table'>AttackSkillData</a>
          <a className="col-6 p-0 rounded-0 btn btn-primary" href='#defSkill_table'>DefSkillData</a>
        </div>
      </div>
      {/* 電腦版呈現在底部的的裝飾圖片 */}
      <div className="d-none d-md-block position-fixed" style={{ bottom: '0', left: '-7.5%', pointerEvents: 'none' }}>
        <video src={`${process.env.PUBLIC_URL}/video/安赛尔-悠然假日 HDm06-基建-Special-x1.webm`} autoPlay loop muted className='h-auto opacity-75' style={{ width: '500px' }}>
          您的瀏覽器不支持 HTML5 video 標籤。
        </video>
      </div>
      <div className="d-none d-md-block position-fixed" style={{ bottom: '0', right: '-7.5%', pointerEvents: 'none' }}>
        <video src={`${process.env.PUBLIC_URL}/video/水月-永恒玩家-基建-Special-x1.webm`} autoPlay loop muted className='h-auto opacity-75' style={{ width: '500px', transform: 'scaleX(-1)' }}>
          您的瀏覽器不支持 HTML5 video 標籤。
        </video>  
      </div>
    </div>    
  );
}

export default App;
