import BasicCalculatorModel from '../model/BasicCalculator';
import CookieModel from './Cookie';

const TalentsCalculatorModel = {
  //依照指定key名嘗試查詢幹員對應的天賦，並回傳此天賦的加成值 (若查詢不到則默認回傳0)
  memberTalent: (type, memberRow, attribute) => {
    let addTotal = 0;

    //一個幹員可能會同時有多個天賦也可能完全沒天賦
    memberRow.talents?.forEach(t => {

      //一個天賦可能會同時有多個階段，同時還有包含各階段解鎖需達成的階級以及等級
      //因此需根據當前所選的流派去判斷是否達到解鎖標準

      //流派
      const witchPhases = BasicCalculatorModel.type(type).witchPhases;
      const witchAttributesKeyFrames = BasicCalculatorModel.type(type).witchAttributesKeyFrames;

      //天賦階段需要反向遍歷，從最大階段判斷回去以找到符合階級以及等級的最大階段
      for(let l = t.candidates.length - 1; l > -1; l--){

        //判斷階段
        let phaseCheck = false;
        const phaseNum = parseInt(t.candidates[l].unlockCondition.phase.replace('PHASE_', ''), 10);
        //通用的階段判斷邏輯
        if(phaseNum === witchPhases){
          phaseCheck = true;
        }
        //特殊的階段判斷邏輯
        //因為三星以下幹員沒有精二，這導致使用精二以上的流派來判斷，通用邏輯將無法得出三星以下幹員的最大階段技能
        //因此在使用精二流派判斷時，三星以下幹員直接於第一次判斷時取得階段
        const memberRarity = BasicCalculatorModel.memberRarity(memberRow);
        if(memberRarity < 4 && witchPhases === 2){
          phaseCheck = true;
        }
        
        if (phaseCheck) {
          //特殊的等級判斷邏輯
          let levelCheck = true;
          const levelN = t.candidates[l].unlockCondition.level > 1 ? 1 : 0;
          //四星以上幹員的天賦解鎖都只與階段相關，因此其實只要判斷階段就可以
          //而三星以下幹員的天賦解鎖還會與等級相關，ex: 三星幹員在精一1級與精1滿級各有天賦階段
          //因此為了方便判斷，1級解鎖一律視為0，非1級解鎖一律視為1，以此來配合流派做判斷
          if(memberRarity < 4 && witchPhases !== 2 && levelN === 1 && witchAttributesKeyFrames === 0){
            levelCheck = false;
          }

          if(levelCheck){          
            //一個天賦可能會同時有多個強化效果，甚至可能重複     
            t.candidates[l].blackboard.forEach(b => {
              if (b.key === attribute) {
                addTotal += (b.value ?? 0);
                //判斷合理性，因為有太多key共用的不合理情況
                //ex: 石英天賦的加攻的key是atk
                //鉛踝天賦的攻擊範圍有隱匿單位就加攻的key也是atk
                //泡泡天賦的對攻擊對象減攻擊的key也是atk
                //這導致若是不判斷的話會有許多錯誤引用的數值添加
                if(memberRow.name in TalentsCalculatorModel.talentNotListToBasic){
                  if(TalentsCalculatorModel.talentNotListToBasic[memberRow.name].has(attribute)){
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

  //目前在幹員基礎數據計算天賦加成時使用了這些key: max_hp、atk、def、magic_resistance、base_attack_time、attack_speed
  //此處記錄所有包含以上的key，但是這些key卻不應該用來計算天賦加成的天賦所屬幹員 (後面會標註不能用的理由) 
  talentNotListToBasic: {
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
    //六星
  },

  //此處記錄所有會對攻擊技能的DPS傷害公式計算造成影響的天賦，並嘗試將這些天賦歸類到DPS傷害公式的一個乘區中
  //(回傳雙層object，key對應傷害公式裡的某個乘區，只需要在原本的傷害公式的所有對應乘區上再添加天賦額外倍率，即可在傷害公式上達成對每個幹員的天賦特製化
  talentListToAttackSkill: (type, memberRow) =>{
    
    return {
      //?標記的為較少人使用的屬性，可以只在那些人的object裡宣告該屬性即可 (會順便在旁邊標註有誰使用了這個屬性)
      //def_penetrate_fixed的值必須是正數，否則會反過來幫敵方加防禦，絕對值<1的以比例計算，絕對值>1的以固定計算
      //magic_resistance的值必須是負數，否則會反過來幫敵方加法抗，絕對值<1的以比例計算，絕對值>1的以固定計算
      //other，絕對值<1的以比例計算，絕對值>1的以固定計算
      'default': { atk: "攻擊乘算", atk_scale: "攻擊倍率", def_penetrate_fixed: "削減敵方防禦[比例或固定]", magic_resistance: "削減敵方法抗[比例或固定]", 
        damage_scale: "傷害倍率", base_attack_time: "攻擊間隔調整", attack_speed: "攻擊速度調整", 
        other: "?額外造成傷害[比例或固定] (騁風)", ensure_damage: "?保底傷害 (酸糖)" },      
      //'範例': { atk: 0, atk_scale: 0, def_penetrate_fixed: 0, magic_resistance: 0, damage_scale: 0, base_attack_time: 0, attack_speed: 0 },
      //四星
      '骋风': { atk: 0, atk_scale: 0, def_penetrate_fixed: 0, magic_resistance: 0, damage_scale: 0, base_attack_time: 0, attack_speed: 0, other: TalentsCalculatorModel.memberTalent(type, memberRow, 'atk_scale') },
      '宴': { atk: 0, atk_scale: 0, def_penetrate_fixed: 0, magic_resistance: 0, damage_scale: 0, base_attack_time: 0, attack_speed: TalentsCalculatorModel.memberTalent(type, memberRow, 'min_attack_speed') },
      '猎蜂': { atk: TalentsCalculatorModel.memberTalent(type, memberRow, 'atk') * TalentsCalculatorModel.memberTalent(type, memberRow, 'max_stack_cnt'), atk_scale: 0, def_penetrate_fixed: 0, magic_resistance: 0, damage_scale: 0, base_attack_time: 0, attack_speed: 0 },
      '酸糖': { atk: 0, atk_scale: 0, def_penetrate_fixed: 0, magic_resistance: 0, damage_scale: 0, base_attack_time: 0, attack_speed: 0, ensure_damage: TalentsCalculatorModel.memberTalent(type, memberRow, 'atk_scale_2') },
      '夜烟': { atk: 0, atk_scale: 0, def_penetrate_fixed: 0, magic_resistance: TalentsCalculatorModel.memberTalent(type, memberRow, 'magic_resistance'), damage_scale: 0, base_attack_time: 0, attack_speed: 0 },
      '云迹': { atk: 0, atk_scale: TalentsCalculatorModel.memberTalent(type, memberRow, 'atk_scale'), def_penetrate_fixed: 0, magic_resistance: 0, damage_scale: 0, base_attack_time: 0, attack_speed: 0 },
      //泡泡 atk 天賦是降低攻擊對象的攻擊力，暫時不知道怎麼應用於敵人的傷害公式 
    }
    
    
  }
}

export default TalentsCalculatorModel;
