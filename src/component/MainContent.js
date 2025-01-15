import React, { useState } from 'react';
import MemberSpecial from '../model/MemberSpecial';

function MainContent() {
  const [enemyHp, setEnemyHp] = useState(0);
  const [enemyAttackType, setEnemyAttackType] = useState();
  const [enemyAttack, setEnemyAttack] = useState(0);
  const [enemyDef, setEnemyDef] = useState(0);
  const [enemyRes, setEnemyRes] = useState(0);
  const [enemySpd, setEnemySpd] = useState(0);
  const [memberJsonData, setMemberJsonData] = useState([]);

  // 我方數據的JSON檔案上傳時執行
  const uploadMemberData = (event) => {
    console.log('我方數據的JSON檔案上傳成功');
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        try {
          const jsonData = JSON.parse(reader.result);
          setMemberJsonData(jsonData);
        } catch (e) {
          console.error('Invalid JSON file');
        }
      };
      reader.readAsText(file); // 讀取檔案內容
    }
  };

  const memberDps = (row) => {
    let finalDamage = 0;
    let finalDps = 0;
    switch(row.attackType){
      case "物傷":
        finalDamage = row.attack - enemyDef;
        if(finalDamage < row.attack / 20){
          finalDamage = row.attack / 20;
        }
        finalDps = (Math.floor(finalDamage / row.spd));        
      return MemberSpecial.memberDpsSpecial(row, finalDps, {enemyHp, enemyAttackType, enemyAttack, enemyDef, enemyRes, enemySpd });
      case "法傷":
        finalDamage = row.attack * ((100 - enemyRes) / 100);
        if(finalDamage < row.attack / 20){
          finalDamage = row.attack / 20;
        }
        finalDps = (Math.floor(finalDamage / row.spd));
      return MemberSpecial.memberDpsSpecial(row, finalDps, {enemyHp, enemyAttackType, enemyAttack, enemyDef, enemyRes, enemySpd });
      default:
      return 0;
    }
  }

  const memberHps = (row) => {
    let finalHps = 0;
    switch(row.attackType){
      case "治療":
        finalHps = (Math.floor(row.attack / row.spd));
      return MemberSpecial.memberHpsSpecial(row, finalHps);
      default:
      return 0;
    }
  }

  const memberKillTime = (row) => {
    let finalDamage = 0;
    let finalDps = 0;
    let trueDps = '';
    let dpsStr = '';
    switch(row.attackType){
      case "物傷":
        finalDamage = row.attack - enemyDef;
        if(finalDamage < row.attack / 20){
          finalDamage = row.attack / 20;
        }
        finalDps = Math.floor(finalDamage / row.spd)
        trueDps = MemberSpecial.memberDpsSpecial(row, finalDps, {enemyHp, enemyAttackType, enemyAttack, enemyDef, enemyRes, enemySpd });
        dpsStr = trueDps.replace(/\D/g, '');
      return (Math.ceil(enemyHp / parseInt(dpsStr)));
      case "法傷":
        finalDamage = row.attack * ((100 - enemyRes) / 100);
        if(finalDamage < row.attack / 20){
          finalDamage = row.attack / 20;
        }
        finalDps = Math.floor(finalDamage / row.spd)
        trueDps = MemberSpecial.memberDpsSpecial(row, finalDps, {enemyHp, enemyAttackType, enemyAttack, enemyDef, enemyRes, enemySpd });
        dpsStr = trueDps.replace(/\D/g, '');
      return (Math.ceil(enemyHp / parseInt(dpsStr)));
      default:
      return "NO";
    }
  }

  const enemyDps = (row) => {
    let finalDamage = 0;
    switch(enemyAttackType){
      case "A":
        finalDamage = enemyAttack - row.def;
        if(finalDamage < enemyAttack / 20){
          finalDamage = enemyAttack / 20;
        }
      return (Math.floor(finalDamage / enemySpd));
      case "B":
        finalDamage = enemyAttack * ((100 - row.res) / 100);
        if(finalDamage < enemyAttack / 20){
          finalDamage = enemyAttack / 20;
        }
      return (Math.floor(finalDamage / enemySpd));
      default:
      return 0;
    }
  }

  return (
    <div className='container'>
      <div className='d-flex flex-column'>
        <div>     
          <form id='enemy_form'>
            <h1>敵人數據</h1>
            <label htmlFor="enemyHp">生命:</label>
            <input type="number" id="enemyHp" value={enemyHp} onChange={(e) => setEnemyHp(e.target.value)} min="0" required />
            <br></br>
            <label htmlFor="enemyAttackType">傷害類型:</label>
            <label htmlFor="enemyAttackType1">物傷</label>
            <input type="radio" name="enemyAttackType" value="A" checked={enemyAttackType === 'A'} onChange={(e) => setEnemyAttackType(e.target.value)} required />
            <label htmlFor="enemyAttackType2">法傷</label>
            <input type="radio" name="enemyAttackType" value="B" checked={enemyAttackType === 'B'} onChange={(e) => setEnemyAttackType(e.target.value)} />
            <br></br>
            <label htmlFor="enemyAttack">攻擊:</label>
            <input type="number" id="enemyAttack" value={enemyAttack} onChange={(e) => setEnemyAttack(e.target.value)} min="0" required />
            <br></br>
            <label htmlFor="enemyDef">防禦:</label>
            <input type="number" id="enemyDef" value={enemyDef} onChange={(e) => setEnemyDef(e.target.value)} min="0" required />
            <br></br>
            <label htmlFor="enemyRes">法抗:</label>
            <input type="number" id="enemyRes" value={enemyRes} onChange={(e) => setEnemyRes(e.target.value)} min="0" max="100" required />
            <br></br>
            <label htmlFor="enemySpd">攻速:</label>
            <input type="number" id="enemySpd" value={enemySpd} onChange={(e) => setEnemySpd(e.target.value)} min="0" step="0.1" required />
            <br></br>        
          </form>          
        </div>
        <hr></hr>
        <div>
          <h1>請選擇JSON檔:</h1>
          <input type="file" accept=".json" onChange={uploadMemberData} />
        </div>
        <hr></hr>
        <p>以下我方數據皆以精1滿級滿潛能滿信賴及天賦加成為準</p>
        <p>我方名稱帶有*表示其面板數值為經天賦加成後的最終結果</p>
        <p>(ex: 波登可天賦為在場時輔助幹員加攻擊力，由於波登可自身就為輔助幹員，基本等同於永久加成，因此帶入計算)</p>
        <p>我方DPS和HPS帶有*表示其數值為受職業特性或天賦影響後的最終結果</p>
        <p>(ex: 酸糖天賦為至少造成20%傷害，因此刮痧時打出的保底傷害與正常幹員的5%不一樣需另外計算)</p>
        <p>我方DPS和HPS帶有+表示其數值可能受職業特性或天賦影響，但由於是概率或必須滿足特定條件才觸發，因此不帶入計算，只計算無觸發的正常結果</p>
        <p>(幹員頭像取自PRTS)</p>
        <table id="member_table" className="table table-bordered table-hover">
          <thead>
            <tr className='table-secondary'>
              <th rowSpan='1' colSpan='12'>我方數據</th>
              <th rowSpan='1' colSpan='3'>敵人數據</th>
            </tr>
            <tr className='table-secondary'>
                <th></th>
                <th>名稱</th>
                <th>職業</th>
                <th>生命</th>
                <th>傷害類型</th>
                <th>攻擊</th>
                <th>防禦</th>
                <th>法抗</th>
                <th>攻速</th>
                <th>我方DPS</th>
                <th>我方HPS</th>
                <th>我方擊殺所需時間</th>
                <th>敵方DPS</th>
            </tr>
          </thead>
          <tbody>
            {memberJsonData.map((row, index) => (
              <tr key={index}>
                <td className="text-center"><img src={row.icon} alt='member_icon' width='50' height='50' /></td>
                <td>{row.name}</td>
                <td>{row.type}</td>
                <td>{row.hp}</td>
                <td>{row.attackType}</td>
                <td>{row.attack}</td>
                <td>{row.def}</td>
                <td>{row.res}</td>
                <td>{row.spd}</td>
                <td>{memberDps(row)}</td>
                <td>{memberHps(row)}</td>
                <td>{memberKillTime(row)}</td>
                <td>{enemyDps(row)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default MainContent;
