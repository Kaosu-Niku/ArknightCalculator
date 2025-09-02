import React, { useState, useEffect, useRef } from 'react';
import $ from "jquery";
import "datatables.net";
import "datatables.net-dt/css/dataTables.dataTables.min.css";
import BasicCalculatorModel from '../model/BasicCalculator';
import SkillCalculatorModel from '../model/SkillCalculator';
import UniequipCalculatorModel from '../model/UniequipCalculator';
import CookieModel from '../model/Cookie';
import FilterModel from '../model/Filter';

const fetchData = async () => {
    const [
        professionResponse, subProfessionIdResponse, characterResponse,
        uniequipResponse, battleEquipResponse, skillResponse
    ] = await Promise.all([
        fetch(`${process.env.PUBLIC_URL}/json/profession.json`),
        fetch(`${process.env.PUBLIC_URL}/json/subProfessionId.json`),
        fetch(`${process.env.PUBLIC_URL}/json/character_table.json`),
        fetch(`${process.env.PUBLIC_URL}/json/uniequip_table.json`),
        fetch(`${process.env.PUBLIC_URL}/json/battle_equip_table.json`),
        fetch(`${process.env.PUBLIC_URL}/json/skill_table.json`),
    ]);

    return {
        professionJsonData: await professionResponse.json(),
        subProfessionIdJsonData: await subProfessionIdResponse.json(),
        characterJsonData: await characterResponse.json(),
        uniequipJsonData: await uniequipResponse.json(),
        battleEquipJsonData: await battleEquipResponse.json(),
        skillJsonData: await skillResponse.json(),
    };
};

function MainContent() {
    const [data, setData] = useState(null);
    const [whichType, setWhichType] = useState(CookieModel.getCookie('type'));
    const [checkRarity, setCheckRarity] = useState(CookieModel.getCookie('rarity'));
    const [enemyData, setEnemyData] = useState({
        enemyHp: 10000,
        enemyAttackType: '物傷',
        enemyAttack: 500,
        enemyDef: 0,
        enemyRes: 0,
        enemySpd: 1,
        enemySkill: [],
    });
    const [search, setSearch] = useState(false);
    const [candidates, setCandidates] = useState(false);

    const memberTableRef = useRef(null);
    const attackSkillTableRef = useRef(null);

    useEffect(() => {
        fetchData().then(setData);
    }, []);

    // 當數據載入完畢，或篩選條件變更時重新渲染表格
    useEffect(() => {
        if (!data) return;

        const { professionJsonData, subProfessionIdJsonData, characterJsonData, uniequipJsonData, battleEquipJsonData, skillJsonData } = data;

        // 處理幹員數據
        const processedCharacterData = processCharacterData(characterJsonData, uniequipJsonData, whichType, checkRarity);

        // 處理技能數據
        const processedSkillData = processSkillData(skillJsonData, characterJsonData, uniequipJsonData, whichType, checkRarity);

        // 渲染基礎數值表格
        $(memberTableRef.current).DataTable({
            destroy: true,
            data: processedCharacterData,
            pageLength: 20,
            processing: true,
            language: { processing: "數據載入中，請稍候..." },
            columns: [
                { title: "名稱", data: "name" },
                { title: "星級", render: (data, type, row) => BasicCalculatorModel.memberRarity(row) },
                { title: "職業", render: (data, type, row) => BasicCalculatorModel.memberProfession(row, professionJsonData).chineseName },
                { title: "分支", render: (data, type, row) => BasicCalculatorModel.memberSubProfessionId(row, subProfessionIdJsonData).chineseName },
                {
                    title: "模組", render: (data, type, row) => {
                        const equipData = UniequipCalculatorModel.memberEquipData(row, uniequipJsonData);
                        return equipData ? equipData.uniEquipName : `${row.name}证章`;
                    }
                },
                { title: "生命", render: (data, type, row) => FilterModel.numberFilter(BasicCalculatorModel.memberNumeric(whichType, row, uniequipJsonData, battleEquipJsonData).maxHp) },
                { title: "傷害類型", render: (data, type, row) => BasicCalculatorModel.memberSubProfessionId(row, subProfessionIdJsonData).attackType },
                { title: "攻擊", render: (data, type, row) => FilterModel.numberFilter(BasicCalculatorModel.memberNumeric(whichType, row, uniequipJsonData, battleEquipJsonData).atk) },
                { title: "防禦", render: (data, type, row) => FilterModel.numberFilter(BasicCalculatorModel.memberNumeric(whichType, row, uniequipJsonData, battleEquipJsonData).def) },
                { title: "法抗", render: (data, type, row) => FilterModel.numberFilter(BasicCalculatorModel.memberNumeric(whichType, row, uniequipJsonData, battleEquipJsonData).magicResistance) },
                { title: "攻擊間隔", render: (data, type, row) => BasicCalculatorModel.memberNumeric(whichType, row, uniequipJsonData, battleEquipJsonData).baseAttackTime },
                { title: "攻速", render: (data, type, row) => FilterModel.numberFilter(BasicCalculatorModel.memberNumeric(whichType, row, uniequipJsonData, battleEquipJsonData).attackSpeed) },
            ],
            order: [[0, 'asc'], [4, 'asc']],
            drawCallback: () => {
                $(memberTableRef.current).find('th').css({ 'background-color': '#c5c5c5', 'color': 'black' });
            }
        });

        // 渲染技能表格 (傷害類)
        $(attackSkillTableRef.current).DataTable({
            destroy: true,
            data: processedSkillData,
            pageLength: 20,
            processing: true,
            language: { processing: "數據載入中，請稍候..." },
            columns: [
                { title: "名稱", render: (data, type, row) => SkillCalculatorModel.skillFromMember(row, characterJsonData).name },
                { title: "星級", render: (data, type, row) => BasicCalculatorModel.memberRarity(SkillCalculatorModel.skillFromMember(row, characterJsonData)) },
                { title: "職業", render: (data, type, row) => BasicCalculatorModel.memberProfession(SkillCalculatorModel.skillFromMember(row, characterJsonData), professionJsonData).chineseName },
                { title: "分支", render: (data, type, row) => BasicCalculatorModel.memberSubProfessionId(SkillCalculatorModel.skillFromMember(row, characterJsonData), subProfessionIdJsonData).chineseName },
                {
                    title: "模組", render: (data, type, row) => {
                        const equipData = UniequipCalculatorModel.memberEquipData(SkillCalculatorModel.skillFromMember(row, characterJsonData), uniequipJsonData);
                        return equipData ? equipData.uniEquipName : `${SkillCalculatorModel.skillFromMember(row, characterJsonData).name}证章`;
                    }
                },
                { title: "技能名稱", render: (data, type, row) => SkillCalculatorModel.skillData(whichType, row).name },
                { title: "冷卻時間", render: (data, type, row) => SkillCalculatorModel.skillData(whichType, row).spData.spCost },
                { title: "持續時間", render: (data, type, row) => SkillCalculatorModel.skillData(whichType, row).duration },
                { title: "彈藥數量", render: (data, type, row) => SkillCalculatorModel.skillCustomAttribute(whichType, row, characterJsonData, uniequipJsonData, battleEquipJsonData, 'attack@trigger_time') },
                { title: "技能類型", render: (data, type, row) => BasicCalculatorModel.memberSubProfessionId(SkillCalculatorModel.skillFromMember(row, characterJsonData), subProfessionIdJsonData).attackType },
                { title: "攻擊乘算", render: (data, type, row) => SkillCalculatorModel.skillCustomAttribute(whichType, row, characterJsonData, uniequipJsonData, battleEquipJsonData, 'atk') },
                { title: "攻擊倍率", render: (data, type, row) => SkillCalculatorModel.skillCustomAttribute(whichType, row, characterJsonData, uniequipJsonData, battleEquipJsonData, 'atk_scale') },
                { title: "攻擊間隔調整", render: (data, type, row) => SkillCalculatorModel.skillCustomAttribute(whichType, row, characterJsonData, uniequipJsonData, battleEquipJsonData, 'base_attack_time') },
                { title: "攻擊速度調整", render: (data, type, row) => SkillCalculatorModel.skillCustomAttribute(whichType, row, characterJsonData, uniequipJsonData, battleEquipJsonData, 'attack_speed') },
                { title: "攻擊段數", render: (data, type, row) => SkillCalculatorModel.skillCustomAttribute(whichType, row, characterJsonData, uniequipJsonData, battleEquipJsonData, 'times') },
                { title: "技能期間DPS", render: (data, type, row) => FilterModel.numberFilter(SkillCalculatorModel.skillMemberDps(whichType, row, processedCharacterData, enemyData, subProfessionIdJsonData, uniequipJsonData, battleEquipJsonData, candidates)) },
                { title: "技能總傷", render: (data, type, row) => FilterModel.numberFilter(SkillCalculatorModel.skillMemberTotal(whichType, row, processedCharacterData, enemyData, subProfessionIdJsonData, uniequipJsonData, battleEquipJsonData, candidates)) },
            ],
            order: [[0, 'asc'], [4, 'asc']],
            drawCallback: () => {
                $(attackSkillTableRef.current).find('th').css({ 'background-color': '#c5c5c5', 'color': 'black' });
            }
        });

        // 更新 Cookie
        CookieModel.setCookie('type', whichType);
        CookieModel.setCookie('rarity', checkRarity);
    }, [data, whichType, checkRarity, search, candidates, enemyData]);


    const processCharacterData = (characterJsonData, uniequipJsonData, whichType, checkRarity) => {
        let filterCharacterData = Object.values(characterJsonData);
        filterCharacterData = FilterModel.characterDataFilter(filterCharacterData, checkRarity);

        const { witchPhases } = BasicCalculatorModel.type(whichType);
        const processedData = [...filterCharacterData];

        if (witchPhases === 2) {
            filterCharacterData.forEach(member => {
                const uniequipContentList = UniequipCalculatorModel.memberEquipID(member, uniequipJsonData);
                if (uniequipContentList) {
                    uniequipContentList.forEach(equipId => {
                        if (!equipId.includes("_001_")) {
                            processedData.push({ ...member, equipid: equipId });
                        }
                    });
                }
            });
        }
        return processedData;
    };

    const processSkillData = (skillJsonData, characterJsonData, uniequipJsonData, whichType, checkRarity) => {
        let filterSkillData = Object.values(skillJsonData);
        filterSkillData = FilterModel.skillDataFilter(filterSkillData, characterJsonData, checkRarity);

        const { witchPhases } = BasicCalculatorModel.type(whichType);
        const processedData = [...filterSkillData];

        if (witchPhases === 2) {
            filterSkillData.forEach(skill => {
                const member = SkillCalculatorModel.skillFromMember(skill, characterJsonData);
                if (member) {
                    const uniequipContentList = UniequipCalculatorModel.memberEquipID(member, uniequipJsonData);
                    if (uniequipContentList) {
                        uniequipContentList.forEach(equipId => {
                            if (!equipId.includes("_001_")) {
                                processedData.push({ ...skill, equipid: equipId });
                            }
                        });
                    }
                }
            });
        }
        return processedData;
    };

    const handleEnemySkillAdd = (e) => {
        e.preventDefault();
        const formElements = e.target.elements;
        const newSkill = {
            enemySkillType: formElements.enemySkillType.value,
            enemySkillDamage: Number(formElements.enemySkillDamage.value),
            enemySkillCount: Number(formElements.enemySkillCount.value),
            enemySkillWaitTime: Number(formElements.enemySkillWaitTime.value),
        };
        setEnemyData(prev => ({ ...prev, enemySkill: [...prev.enemySkill, newSkill] }));
        e.target.reset();
    };

    const handleEnemySkillRemove = (indexToRemove) => {
        setEnemyData(prev => ({
            ...prev,
            enemySkill: prev.enemySkill.filter((_, index) => index !== indexToRemove)
        }));
    };

    const getModuleCandidates = (uniequipData, battleEquipData, isCandidates) => {
        const descriptions = [];
        for (const equipId in battleEquipData.equipDict) {
            const equip = battleEquipData.equipDict[equipId];
            const uniequip = uniequipData.uniEquipDict[equipId];
            const display = isCandidates ? "col-4 col-md-3 text-left border border-1 rounded" : "d-none";

            if (equip.type === 'candidates' && uniequip) {
                descriptions.push(
                    <small key={equipId} className={display}>
                        {uniequip.uniEquipName}:<br/> {equip.desc}
                    </small>
                );
            }
        }
        return descriptions;
    };

    if (!data) {
        return <div className="text-center mt-5">載入中...</div>;
    }

    return (
        <div className='container'>
            <div className='p-2 m-1 border border-2 rounded-4 bg-light' id='enemy_form'>
                <div className='row justify-content-center'>
                    <h3 className='col-12 text-center'>敵人數據</h3>
                </div>
                <form>
                    <div className='row justify-content-start justify-content-md-center align-items-center row-gap-1 p-1'>
                        <label className='col-2 col-md-1 text-center' htmlFor="enemyHp">生命</label>
                        <input className='col-3 col-md-2' type="number" id="enemyHp" value={enemyData.enemyHp} onChange={(e) => setEnemyData(prev => ({ ...prev, enemyHp: Number(e.target.value) }))} min="0" required />
                        <label className='col-2 col-md-1 text-center' htmlFor="enemyAttack">攻擊</label>
                        <input className='col-3 col-md-2' type="number" id="enemyAttack" value={enemyData.enemyAttack} onChange={(e) => setEnemyData(prev => ({ ...prev, enemyAttack: Number(e.target.value) }))} min="0" required />
                        <label className='col-3 col-md-1 text-center' htmlFor="enemyAttackType">傷害類型</label>
                        <div className='col-7 col-md-2 justify-content-around align-items-center d-flex'>
                            <input type="radio" name="enemyAttackType" value="物傷" checked={enemyData.enemyAttackType === '物傷'} onChange={(e) => setEnemyData(prev => ({ ...prev, enemyAttackType: e.target.value }))} required />
                            <label htmlFor="enemyAttackType1">物傷</label>
                            <input type="radio" name="enemyAttackType" value="法傷" checked={enemyData.enemyAttackType === '法傷'} onChange={(e) => setEnemyData(prev => ({ ...prev, enemyAttackType: e.target.value }))} />
                            <label htmlFor="enemyAttackType2">法傷</label>
                            <input type="radio" name="enemyAttackType" value="真傷" checked={enemyData.enemyAttackType === '真傷'} onChange={(e) => setEnemyData(prev => ({ ...prev, enemyAttackType: e.target.value }))} />
                            <label htmlFor="enemyAttackType3">真傷</label>
                        </div>
                    </div>
                    <div className='row justify-content-start justify-content-md-center align-items-center row-gap-1 p-1'>
                        <label className='col-2 col-md-1 text-center' htmlFor="enemyDef">防禦</label>
                        <input className='col-3 col-md-2' type="number" id="enemyDef" value={enemyData.enemyDef} onChange={(e) => setEnemyData(prev => ({ ...prev, enemyDef: Number(e.target.value) }))} min="0" required />
                        <label className='col-2 col-md-1 text-center' htmlFor="enemyRes">法抗</label>
                        <input className='col-3 col-md-2' type="number" id="enemyRes" value={enemyData.enemyRes} onChange={(e) => setEnemyData(prev => ({ ...prev, enemyRes: Number(e.target.value) }))} min="0" max="100" required />
                        <div className='d-block d-md-none col-2'></div>
                        <label className='col-2 col-md-1 text-center' htmlFor="enemySpd">攻速</label>
                        <input className='col-3 col-md-2' type="number" id="enemySpd" value={enemyData.enemySpd} onChange={(e) => setEnemyData(prev => ({ ...prev, enemySpd: Number(e.target.value) }))} min="0" step="0.01" required />
                    </div>
                </form>
            </div>
            <div className='p-2 m-1 border border-2 rounded-4 bg-light'>
                <div className='row justify-content-center row-gap-1'>
                    <h3 className='col-12 text-center'>敵人技能</h3>
                    <small className="col-12 text-center">{`若技能屬於一次性傷害，填寫 (技能傷害 = 總傷) (傷害次數 = 1)`}</small>
                    <small className="col-12 text-center">{`若技能屬於持續性傷害，填寫 (技能傷害 = 每次造成的傷害) (傷害次數 = 傷害次數)`}</small>
                </div>
                <form onSubmit={handleEnemySkillAdd}>
                    <div className='row justify-content-start justify-content-md-center align-items-center p-1'>
                        <label className='col-3 col-md-1 text-center' htmlFor="enemySkillDamage">技能傷害</label>
                        <input className='col-7 col-md-2' type="number" id="enemySkillDamage" name="enemySkillDamage" min="0" required />
                        <label className='col-3 col-md-1 text-center' htmlFor="enemySkillCount">傷害次數</label>
                        <input className='col-7 col-md-2' type="number" id="enemySkillCount" name="enemySkillCount" min="1" required />
                    </div>
                    <div className='row justify-content-start justify-content-md-center align-items-center p-1'>
                        <label className='col-3 col-md-1 text-center' htmlFor="enemySkillType">傷害類型</label>
                        <div className='col-7 col-md-2 justify-content-around align-items-center d-flex'>
                            <input type="radio" name="enemySkillType" value="物傷" required />
                            <label htmlFor="enemySkillType1">物傷</label>
                            <input type="radio" name="enemySkillType" value="法傷" />
                            <label htmlFor="enemySkillType2">法傷</label>
                            <input type="radio" name="enemySkillType" value="真傷" />
                            <label htmlFor="enemySkillType3">真傷</label>
                        </div>
                        <label className='col-3 col-md-1 text-center' htmlFor="enemySkillWaitTime">冷卻時間</label>
                        <input className='col-7 col-md-2' type="number" id="enemySkillWaitTime" name="enemySkillWaitTime" min="1" required />
                    </div>
                    <div className='row justify-content-center align-items-center p-1'>
                        <button className='col-4 col-md-2 btn btn-danger' type="submit">新增技能</button>
                    </div>
                </form>
                <div className="row justify-content-center">
                    {enemyData.enemySkill.map((group, index) => (
                        <div className="col-10 col-md-2 m-2 border border-2 rounded-4 bg-light" key={index}>
                            <div className="d-flex flex-column p-2">
                                <div className='row justify-content-center align-items-center'>
                                    <span className='col-6 text-center'>{`技能${index}`}</span>
                                    <div className='col-6 d-flex justify-content-end'>
                                        <button className='btn btn-close' type='button' onClick={() => handleEnemySkillRemove(index)}></button>
                                    </div>
                                    <span className='col-6 text-center'>{`傷害類型:`}</span>
                                    <span className='col-6'>{`${group.enemySkillType}`}</span>
                                    <span className='col-6 text-center'>{`技能傷害:`}</span>
                                    <span className='col-6'>{`${group.enemySkillDamage}`}</span>
                                    <span className='col-6 text-center'>{`傷害次數:`}</span>
                                    <span className='col-6'>{`${group.enemySkillCount}`}</span>
                                    <span className='col-6 text-center'>{`冷卻時間:`}</span>
                                    <span className='col-6'>{`${group.enemySkillWaitTime}`}</span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
            <div className='p-2 m-1 border border-2 rounded-4 bg-light'>
                <div className="row justify-content-around row-gap-1 p-2">
                    {['精零1級', '精零滿級', '精一1級', '精一滿級', '精二1級', '精二滿級'].map(type => (
                        <button
                            key={type}
                            className={`${whichType === type ? 'btn-primary' : 'btn-secondary'} col-7 col-md-3 btn`}
                            onClick={() => setWhichType(type)}
                        >
                            {type}
                        </button>
                    ))}
                </div>
                <div className="row justify-content-around row-gap-1 p-2">
                    {Object.keys(checkRarity).map(rarityKey => (
                        <React.Fragment key={rarityKey}>
                            <input
                                type="checkbox"
                                className='col-2 col-md-1'
                                checked={checkRarity[rarityKey]}
                                onChange={(e) => setCheckRarity(pre => ({ ...pre, [rarityKey]: e.target.checked }))}
                            />
                            <label className='col-2 col-md-1'>{`${rarityKey.replace('TIER_', '')}星`}</label>
                        </React.Fragment>
                    ))}
                </div>
                <div className="row justify-content-around row-gap-1 p-2">
                    <button className='btn btn-primary col-9 col-md-5' onClick={() => setSearch(!search)}>查詢</button>
                </div>
            </div>
            <div className='p-2 m-1 border border-2 rounded-4 bg-light' id='member_table'>
                <div className='row justify-content-center row-gap-1'>
                    <small className="col-12 text-center">目前表格呈現的數據已包含以下加成:</small>
                    <small className="col-12 text-center">潛能加成 (生命、攻擊、防禦、法抗、攻速)</small>
                    <small className="col-12 text-center">滿信賴加成 (生命、攻擊、防禦、法抗)</small>
                    <small className="col-12 text-center">天賦加成 (生命、攻擊、防禦、法抗、攻擊間隔、攻速)</small>
                    <small className="col-12 text-center">模組加成 (生命、攻擊、防禦、法抗、攻速)</small>
                    <small className="col-12 text-center">(五星和六星的天賦和技能數據還未進行特製化處理，因此五星和六星的數據還不準，請勿參考)</small>
                </div>
                <div className='table-responsive'>
                    <table ref={memberTableRef} className="table table-bordered table-hover display table-light"></table>
                </div>
            </div>
            <div className='p-2 m-1 border border-2 rounded-4 bg-light' id='attackSkill_table'>
                <div className='row justify-content-center row-gap-1'>
                    <small className="col-12 text-center">持續時間為-1或0表示其為強力擊、永續類、子彈類的技能</small>
                    <small className="col-12 text-center">技能與天賦中含有概率或是條件觸發的，一律不計算，默認沒有觸發</small>
                    <small className="col-12 text-center">模組的特性追加中與傷害計算無關的屬性，一律不計算，默認沒有觸發</small>
                    <small className="col-12 text-center">模組的特性追加中含有概率或是條件觸發的，預設沒有觸發，但可勾選下列選項觸發</small>
                    <div className="col-12 text-center my-2">
                        <input type="checkbox" className='col-2 col-md-1' checked={candidates} onChange={(event) => setCandidates(event.target.checked)} />
                        <span className="col-6 text-danger">是否觸發所有含有概率或是條件觸發的模組特性追加?</span>
                    </div>
                    <a className="col-12 text-center" data-bs-toggle="collapse" href="#collapseCandidates" role="button" aria-expanded="false" aria-controls="collapseCandidates">點此詳細了解目前觸發的模組特性追加</a>
                    <div className="collapse col-12" id="collapseCandidates">
                        <div className="card card-body border border-2 border-secondary">
                            <div className='row justify-content-start row-gap-1'>
                                {data && getModuleCandidates(data.uniequipJsonData, data.battleEquipJsonData, candidates)}
                            </div>
                        </div>
                    </div>
                </div>
                <div className='table-responsive'>
                    <table ref={attackSkillTableRef} className="table table-bordered table-hover display table-light"></table>
                </div>
            </div>
        </div>
    );
}

export default MainContent;