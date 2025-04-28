import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap/dist/js/bootstrap.bundle.min.js';
import './App.css';
import Header from './component/Header.js';
import MainContent from './component/MainContent.js';
import Footer from './component/Footer.js';

function App() {
  return (
    // <div className="App">
    //   <header className="App-header">
    //     <img src={logo} className="App-logo" alt="logo" />
    //     <p>
    //       Edit <code>src/App.js</code> and save to reload.
    //     </p>
    //     <a
    //       className="App-link"
    //       href="https://reactjs.org"
    //       target="_blank"
    //       rel="noopener noreferrer"
    //     >
    //       Learn React
    //     </a>
    //   </header>
    // </div>
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
      <div className="fixed-buttons">
        <a className="btn btn-danger" href='#enemy_form'>EnemyData</a>
        <a className="btn btn-success" href='#member_table'>MemberData</a>
        <a className="btn btn-warning" href='#attackSkill_table'>AttackSkillData</a>
        <a className="btn btn-primary" href='#defSkill_table'>DefSkillData</a>
      </div>
    </div>    
  );
}

export default App;
