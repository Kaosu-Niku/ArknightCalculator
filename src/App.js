import './App.css';
import './AppCustom.css';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap/dist/js/bootstrap.bundle.min.js';
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
      <Header />
      <MainContent />
      <Footer />
      <div class="fixed-buttons">
      <a class="btn btn-danger" href='#enemy_form'>EnemyData</a>
        <a class="btn btn-success" href='#member_table'>MemberData</a>
        <a class="btn btn-warning" href='#attackSkill_table'>AttackSkillData</a>
        <a class="btn btn-primary" href='#defSkill_table'>DefSkillData</a>
      </div>
    </div>    
  );
}

export default App;
