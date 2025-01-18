const MemberSpecial = {
  memberDpsSpecial: (row, originalDps, emenyData) => {
    let finalDamage = 0;
    switch(row.name){
      case "紅豆":
      return `${originalDps}+`;
      case "慕斯":
      return `${originalDps}+`;
      case "宴":
      return `${originalDps}+`;
      case "獵蜂":
      return `${originalDps}+`;
      case "月見夜":
      return `${originalDps}+`;
      case "芳汀":
      return `${originalDps}+`;
      case "刻刀":
        // 職業特性為攻擊皆是二連擊
        finalDamage = row.attack - emenyData.enemyDef;
        if(finalDamage < row.attack / 20){
          finalDamage = row.attack / 20;
        }
      return `${(Math.floor((finalDamage * 2) / row.spd))}*`;
      case "克洛絲":
      return `${originalDps}+`;
      case "流星":
      return `${originalDps}+`;
      case "躍躍":
      return `${originalDps}+`;
      case "酸糖":
        // 天賦為至少保底20%傷害
        finalDamage = 0;
        finalDamage = row.attack - emenyData.enemyDef;
        if(finalDamage < row.attack / 5){
          finalDamage = row.attack / 5;
        }
      return `${(Math.floor(finalDamage / row.spd))}*`;
      case "鉛踝":
      return `${originalDps}+`;
      case "松果":
      return `${originalDps}+`;
      case "夜煙":
        // 天賦為攻擊給敵人-10%法抗1秒(夜煙自身攻擊都能吃到加成)
        finalDamage = row.attack * ((100 - Math.ceil(emenyData.enemyRes * 0.9)) / 100);
        if(finalDamage < row.attack / 20){
          finalDamage = row.attack / 20;
        }
      return `${(Math.floor(finalDamage / row.spd))}*`;
      case "卡達":
        // 職業特性為攻擊皆是自身與浮游單元的獨立攻擊，且浮游單元攻擊同個單位還會有最高疊層造成110%攻擊力的傷害
        finalDamage = row.attack * ((100 - emenyData.enemyRes) / 100);
        if(finalDamage < row.attack / 20){
          finalDamage = row.attack / 20;
        }
        let otherDamage = row.attack * 1.1 * ((100 - emenyData.enemyRes) / 100);
        if(otherDamage < row.attack * 1.1 / 20){
          otherDamage = row.attack * 1.1 / 20;
        }
      return `${(Math.floor((finalDamage + otherDamage) / row.spd))}*`;
      case "古米":
      return `${originalDps}+`;
      case "巫役小車":
        // 天賦為部署後的40秒內每次攻擊附帶60凋亡損傷，且使攻擊範圍內所有敵人+10%法術脆弱和+10%元素脆弱
        // (所以實際上應該是每次攻擊附帶66凋亡損傷，而小車40秒內可以打25下，所以造成凋亡損傷的總值為1650)        
        finalDamage = row.attack * ((100 - emenyData.enemyRes) / 100) * 1.1;
        if(finalDamage < row.attack / 20){
          finalDamage = row.attack / 20;
        }
        // (普通與精英敵人的損傷累計值為1000，BOSS敵人的損傷累計值為2000)
        // (對普通與精英敵人來說，小車可於第16下打爆條，也就是部屬後約25秒)
        // (凋亡損傷爆條期間造成每秒800元素傷害，持續15秒，所以造成元素傷害的總傷為12000)
      return `${(Math.floor(finalDamage / row.spd))}*`;
      case "孑":
      return `${originalDps}+`;
      case "雲跡":
      return `${originalDps}+`;
      default:
      return `${originalDps}`;
    }
  },
  memberHpsSpecial: (row, originalHps) => {
    switch(row.name){
      case "安賽爾":
      return `${originalHps}+`;
      case "蘇蘇洛":
      return `${originalHps}+`;
      case "褐果":
      return `${originalHps}+`;
      case "調香師":
        let otherHps = Math.floor(row.attack / 100 * 3);
      return `${originalHps + otherHps}*`;
      default:
      return `${originalHps}`;
    }
  }
}

export default MemberSpecial;
