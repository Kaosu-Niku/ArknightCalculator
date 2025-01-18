import React, { useState, useEffect, useRef } from 'react';
import $ from "jquery";
import "datatables.net";
import "datatables.net-dt/css/dataTables.dataTables.min.css";
import MemberSpecial from '../model/MemberSpecial';

function MainContent() {
  const [enemyHp, setEnemyHp] = useState(0);
  const [enemyAttackType, setEnemyAttackType] = useState();
  const [enemyAttack, setEnemyAttack] = useState(0);
  const [enemyDef, setEnemyDef] = useState(0);
  const [enemyRes, setEnemyRes] = useState(0);
  const [enemySpd, setEnemySpd] = useState(0);
  const [memberJsonData, setMemberJsonData] = useState([]);

  const memberTableRef = useRef(null);
  const attackSkillTableRef = useRef(null);
  useEffect(() => {
    if (memberJsonData.Basic != undefined) {
      // 使用DataTable套件來製作表格

      //基本數值表格
      $(memberTableRef.current).DataTable({
        destroy: true,  // 使表格可以重新初始化
        data: memberJsonData.Basic, //表格使用的資料
        pageLength: 100, // 每頁顯示100筆資料
        columns: [
          { title: "", data: null, render: function(row) {return `<img src=${row.icon} alt='member_icon' width='50' height='50' />`} },
          { title: "名稱", data: "name" },
          { title: "職業", data: "type" },
          { title: "生命", data: "hp" },
          { title: "傷害類型", data: "attackType" },
          { title: "攻擊", data: "attack" },
          { title: "防禦", data: "def" },
          { title: "法抗", data: "res" },
          { title: "攻速", data: "spd" },
          { title: "我方DPS", data: null, render: function(data, type, row) {return memberDps(row);} },
          { title: "我方HPS", data: null, render: function(data, type, row) {return memberHps(row);} },
          { title: "我方擊殺所需時間", data: null, render: function(data, type, row) {return memberKillTime(row);} },
          { title: "敵方DPS", data: null, render: function(data, type, row) {return enemyDps(row);} },
        ],
      });

      //攻擊技能表格
      $(attackSkillTableRef.current).DataTable({
        destroy: true,  // 使表格可以重新初始化
        data: memberJsonData.AttackSkill, //表格使用的資料
        pageLength: 100, // 每頁顯示100筆資料
        columns: [
          { title: "", data: null, render: function(row) {return `<img src=${row.icon} alt='member_icon' width='50' height='50' />`} },
          { title: "名稱", data: "name" },
          { title: "技能", data: "whichSkill" },
          { title: "傷害類型", data: "attackType" },
          { title: "冷卻時間", data: "waitTime" },
          { title: "持續時間", data: "skillTime" },
          { title: "直接固定加算", data: "attackFirstAdd" },
          { title: "直接倍率乘算", data: "attackFirtsMultiply" },
          { title: "最終固定加算", data: "attackLastAdd" },
          { title: "最終倍率乘算", data: "attackLastMultiply" },
          { title: "攻擊間隔縮減", data: "spdAdd" },
          { title: "攻速提升", data: "spdMultiply" },
          { title: "技能DPS", data: null, render: function(data, type, row) {return attackSkillDps(memberJsonData.Basic, row);} },
        ],
      });
    }
  }, [enemyHp, enemyAttackType, enemyAttack, enemyDef, enemyRes, enemySpd, memberJsonData]); // 每次這些state變數的值改變時就重新初始化表格

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
      return Infinity; //Infinity屬於number的一個值，此值必定會被視為最大值
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

  const attackSkillDps = (memberJsonData, skillRow) => {
    let memberRow = memberJsonData.find(item => item.name === skillRow.name);
    let finalAttack = 0;
    let finalDamage = 0;
    let finalSpd = 0;
    let finalDps = 0;

    // 最終攻擊力 = (((原始攻擊力 + 直接固定加算) * 直接倍率乘算) + 最終固定加算) * 最終倍率乘算
    finalAttack = (((memberRow.attack + skillRow.attackFirstAdd) * skillRow.attackFirtsMultiply) + skillRow.attackLastAdd) * skillRow.attackLastMultiply;
    // 最終攻速 = (原始攻擊間隔 - 攻擊間隔縮短時間) / ((100 + 攻速提升) / 100)
    // 需注意(100 + 攻速提升)的最終值最小不低於20，最大不高於600
    finalSpd = (memberRow.spd - skillRow.spdAdd) / ((100 + Math.max(-80, Math.min(500, skillRow.spdMultiply))) / 100)
    switch(skillRow.attackType){
      case "物傷":
        finalDamage = finalAttack - enemyDef;
        if(finalDamage < finalAttack / 20){
          finalDamage = finalAttack / 20;
        }
        finalDps = (Math.floor(finalDamage / finalSpd));        
      return MemberSpecial.memberDpsSpecial(memberRow, finalDps, {enemyHp, enemyAttackType, enemyAttack, enemyDef, enemyRes, enemySpd });
      case "法傷":
        finalDamage = finalAttack * ((100 - enemyRes) / 100);
        if(finalDamage < finalAttack / 20){
          finalDamage = finalAttack / 20;
        }
        finalDps = (Math.floor(finalDamage / finalSpd));
      return MemberSpecial.memberDpsSpecial(memberRow, finalDps, {enemyHp, enemyAttackType, enemyAttack, enemyDef, enemyRes, enemySpd });
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
        <table id='member_table' ref={memberTableRef} className="table table-bordered table-hover display"></table>
        <table id='attackSkill_table' ref={attackSkillTableRef} className="table table-bordered table-hover display"></table>
      </div>
    </div> 
  );
}

export default MainContent;
