import BasicCalculatorModel from '../model/BasicCalculator';

const TalentsCalculatorModel = {
  //幹員天賦
  memberTalent: (type, memberRow, attribute) => {
    let addTotal = 0;

    //一個幹員可能會同時有多個天賦
    memberRow.talents.forEach(t => {

      //一個天賦可能會同時有多個階段，同時還有包含各階段解鎖需達成的階級以及等級
      //因此需根據當前所選的流派去判斷是否達到解鎖標準

      //流派
      const witchPhases = BasicCalculatorModel.type(type).witchPhases;
      const witchAttributesKeyFrames = BasicCalculatorModel.type(type).witchAttributesKeyFrames;

      //天賦階段需要反向遍歷，從最大階段判斷回去以找到符合階級以及等級的最大階段
      for(let l = t.candidates.length - 1; l > -1; l--){
        //phases是array型別，對應幹員所有階段，[0] = 精零、[1] = 精一、[2] = 精二
        //phases.attributesKeyFrames是array型別，對應幹員1級與滿級的數據，[0] = 1級、[1] = 滿級

        //判斷階段
        if (t.candidates[l].unlockCondition.phase === `PHASE_${witchPhases}`) {
          //判斷等級
          if (witchAttributesKeyFrames >= t.candidates[l].unlockCondition.level) {
            //一個天賦可能會同時有多個強化效果，甚至可能重複     
            t.candidates[l].blackboard.forEach(b => {
              if (b.key === attribute) {
                addTotal += (b.value ?? 0);
                //判斷合理性，因為有太多key共用的不合理情況
                //ex: 石英天賦的加攻的key是atk
                //鉛踝天賦的攻擊範圍有隱匿單位就加攻的key也是atk
                //泡泡天賦的對攻擊對象減攻擊的key也是atk
                //這導致若是不判斷的話會有許多錯誤引用的數值添加
                if(memberRow.name in TalentsCalculatorModel.talentNotList){
                  if(TalentsCalculatorModel.talentNotList[memberRow.name].has(attribute)){
                    addTotal -= (b.value ?? 0);
                  }
                }
              }
            });
              
            break;          
          }
        }
      }
    });
    return addTotal;
  },

  //此處記錄了所有不應該被用於幹員數據計算的天賦數值加成的天賦key
  talentNotList: {
    //四星
    '红豆': new Set(['atk']), //概率暴擊
    '清道夫': new Set(['atk','def']), //周圍沒有友方單位，提升攻擊力、防禦力
    '讯使': new Set(['def']), //阻擋兩個以上敵人，提升防禦力
    '猎蜂': new Set(['atk']), //攻擊同個敵人持續疊加攻擊力
    '杜宾': new Set(['atk']), //在場時，三星幹員提升攻擊力   
    '铅踝': new Set(['atk']), //攻擊範圍內存在隱匿單位時提升攻擊力
    '远山': new Set(['max_hp', 'atk', 'attack_speed']), //部屬後隨機三選一BUFF，提升生命、提升攻擊力、提升攻速
    '泡泡': new Set(['atk']), //降低攻擊對象的攻擊力
    '嘉维尔': new Set(['atk','def']), //部屬後15秒內所有醫療幹員提升攻擊力、防禦力
    //五星
  }
}

export default TalentsCalculatorModel;
