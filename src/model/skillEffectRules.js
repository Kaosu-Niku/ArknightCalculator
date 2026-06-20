import TalentsCalculatorModel from './TalentsCalculator';

const memberTalent = ({
  type,
  memberRow,
  uniequipJsonData,
  battleEquipJsonData,
}, attribute) => {
  return TalentsCalculatorModel.memberTalent(
    type,
    memberRow,
    uniequipJsonData,
    battleEquipJsonData,
    attribute
  );
};

const memberTalentRaw = ({
  type,
  memberRow,
  uniequipJsonData,
  battleEquipJsonData,
}, attribute) => {
  return TalentsCalculatorModel.memberTalentRaw(
    type,
    memberRow,
    uniequipJsonData,
    battleEquipJsonData,
    attribute
  );
};

const stopAttacking = () => ({
  CHANGE_attackType: '不攻擊',
  DISABLE_TRAIT_EXTRA: 1,
});

const skillEffectRuleFactories = {
  '斑点-次级治疗模式': stopAttacking,
  '协律-震爆调谐': ({ conditionEffectsEnabled, skillAttribute }) => ({
    ...(conditionEffectsEnabled ? {
      CHANGE_OTHER_attackType: '法術',
      OTHER_atk_scale: skillAttribute('attack@aoe_atk_scale'),
    } : {}),
  }),
  '深靛-灯塔守卫者': ({ skillAttribute }) => ({
    atk_scale: skillAttribute('attack@atk_scale'),
    base_attack_time: 3 * skillAttribute('base_attack_time'),
  }),
  '深靛-光影迷宫': ({ skillAttribute }) => ({
    base_attack_time: 3 * (-1 + skillAttribute('base_attack_time')),
    CHANGE_OTHER_attackType: '法術',
    OTHER_atk_scale: skillAttribute('indigo_s_2[damage].atk_scale'),
    OTHER_base_attack_time: skillAttribute('indigo_s_2[damage].interval'),
  }),
  '白雪-凝武': ({ skillAttribute }) => ({
    CHANGE_OTHER_attackType: '法術',
    OTHER_atk_scale: skillAttribute('attack@atk_scale'),
    OTHER_base_attack_time: 1,
  }),
  '松果-电能过载': ({ skillAttribute }) => ({
    atk: skillAttribute('pinecn_s_2[d].atk'),
  }),
  '酸糖-扳机时刻': () => ({
    ATTACK_COUNT: 2,
  }),
  '铅踝-破虹': ({ skillAttribute }) => ({
    atk_scale: skillAttribute('attack@s2c.atk_scale'),
  }),
  '跃跃-乐趣加倍': ({ skillAttribute }) => ({
    ATTACK_COUNT: skillAttribute('cnt'),
  }),
  '桃金娘-支援号令·β型': stopAttacking,
  '桃金娘-治愈之翼': stopAttacking,
  '宴-分神': stopAttacking,
  '芳汀-小玩笑': ({ skillAttribute }) => ({
    atk_scale: skillAttribute('attack@atk_scale'),
    ATTACK_COUNT: 2,
  }),
  '芳汀-致命恶作剧': ({ skillAttribute }) => ({
    atk_scale: skillAttribute('attack@atk_scale'),
    CHANGE_attackType: '法術',
  }),
  '石英-全力相搏': ({ skillAttribute }) => ({
    atk_scale: skillAttribute('attack@s2_atk_scale'),
  }),
  '休谟斯-高效处理': ({ skillAttribute }) => ({
    atk: skillAttribute('humus_s_2[peak_2].peak_performance.atk'),
  }),
  '骋风-以攻为守': (context) => ({
    CHANGE_OTHER_attackType: '物理',
    OTHER_atk_scale: memberTalent(context, 'atk_scale'),
  }),
  '骋风-招无虚发': (context) => ({
    atk_scale: context.skillAttribute('attack@atk_scale'),
    CHANGE_OTHER_attackType: '物理',
    OTHER_atk_scale: memberTalent(context, 'atk_scale'),
  }),
  '孑-断螯': () => ({
    CHANGE_duration: 2,
  }),
  '孑-刺身拼盘': () => ({
    CHANGE_duration: 2,
  }),
  '蛇屠箱-壳状防御': () => ({
    CHANGE_attackType: '不攻擊',
  }),
  '泡泡-“挨打”': () => ({
    CHANGE_attackType: '不攻擊',
  }),
  '露托-强磁防卫': ({ skillAttribute }) => ({
    CHANGE_attackType: '法術',
    atk_scale: skillAttribute('magic_atk_scale'),
    base_attack_time: 0.4,
  }),
  '古米-食粮烹制': () => ({
    CHANGE_attackType: '治療',
  }),
  '地灵-流沙化': () => ({
    CHANGE_attackType: '不攻擊',
  }),
  '波登可-花香疗法': () => ({
    CHANGE_attackType: '治療',
  }),
  '波登可-孢子扩散': () => ({
    base_attack_time: -0.9,
  }),
  '罗比菈塔-全自动造型仪': () => ({
    CHANGE_attackType: '不攻擊',
  }),
  '松桐-入场安排': () => ({
    CHANGE_attackType: '不攻擊',
  }),
  '松桐-万手成局': ({ skillAttribute }) => ({
    atk: skillAttribute('makiri_s_2[passive].atk'),
  }),
  '历阵锐枪芬-贯敌刺枪': () => ({ ATTACK_COUNT: 2 }),
  '极境-支援号令·γ型': stopAttacking,
  '极境-聆听': stopAttacking,
  '万顷-支援号令·γ型': stopAttacking,
  '万顷-应东风': stopAttacking,
  '齐尔查克-开锁工具': stopAttacking,
  '摩根-街头好手': ({ skillAttribute }) => ({
    atk_scale: skillAttribute('attack@atk_scale'),
  }),
  '摩根-无畏招架': ({ skillAttribute }) => ({
    atk_scale: skillAttribute('attack@atk_scale'),
  }),
  '莱欧斯-威吓战法': ({ skillAttribute }) => ({
    ...stopAttacking(),
    CHANGE_OTHER_attackType: '物理',
    OTHER_atk_scale: skillAttribute('atk_scale'),
    OTHER_times: 1,
  }),
  '达格达-精准捕杀': () => ({ ATTACK_COUNT: 2 }),
  '铎铃-乡心无改': ({ skillAttribute }) => ({
    CHANGE_attackType: '物理',
    atk_scale: skillAttribute('attack@atk_scale'),
    times: 1,
  }),
  '战车-倾泻弹药': ({ conditionalMultiplier }) => ({
    atk_scale: conditionalMultiplier('atk_scale'),
  }),
  '摆渡人-奔流': () => ({
    ATTACK_COUNT: 3,
  }),
  '摆渡人-同胞的意志': ({ skillAttribute }) => ({
    atk_scale: skillAttribute('attack@s2_atk_scale'),
  }),
  '赤冬-信影流·雷刀之势': () => ({ ATTACK_COUNT: 2 }),
  '火龙S黑角-居合拔刀气刃斩': ({ skillAttribute }) => ({
    CHANGE_attackType: '物理',
    atk_scale: skillAttribute('multi_atk_scale'),
    ATTACK_COUNT: skillAttribute('multi_times'),
    times: 1,
  }),
  '羽毛笔-高速切割': () => ({ ATTACK_COUNT: 2 }),
  '海沫-回首，断舍': () => ({ ATTACK_COUNT: 2 }),
  '龙舌兰-当机立断': ({ skillAttribute }) => ({
    atk_scale: skillAttribute('attack@atk_scale'),
  }),
  '龙舌兰-剑走偏锋': ({ skillAttribute }) => ({
    atk_scale: skillAttribute('attack@atk_scale'),
    CHANGE_duration: skillAttribute('enhance_duration'),
  }),
  '聆音-开颅挽歌': ({ skillAttribute }) => ({
    atk_scale: skillAttribute('attack@atk_scale'),
    ATTACK_COUNT: 2,
  }),
  '祐天寺若麦-如焰般热烈': ({ skillAttribute }) => ({
    atk_scale: skillAttribute('attack@atk_scale_heavy')
      + (2 * skillAttribute('attack@atk_scale_light')),
  }),
  '祐天寺若麦-如麦般生长': ({ skillAttribute }) => ({
    atk_scale: (2 * skillAttribute('attack@atk_scale_heavy'))
      + (6 * skillAttribute('attack@atk_scale_light')),
  }),
  '哈蒂娅-沙地战术改良': ({ conditionEffectsEnabled, skillAttribute }) => ({
    atk: conditionEffectsEnabled ? skillAttribute('extra.atk') : 0,
  }),
  '雷狼龙S空爆-高压回填斩': ({ skillAttribute }) => ({
    ATTACK_COUNT: 7.5,
    times: 1,
    CHANGE_OTHER_attackType: '法術',
    OTHER_atk_scale: skillAttribute('attack@atk_magic'),
    OTHER_times: 1,
  }),
  '隐现-“不惹麻烦”': ({ skillAttribute }) => ({
    atk_scale: skillAttribute('attack@atk_scale'),
  }),
  '慑砂-延时震荡零件': ({ skillAttribute }) => ({
    atk_scale: skillAttribute('attack@atk_scale'),
  }),
  '截云-掷旧尘': ({ skillAttribute }) => ({
    ...stopAttacking(),
    CHANGE_OTHER_attackType: '物理',
    OTHER_atk_scale: skillAttribute('atk_scale'),
    OTHER_base_attack_time: skillAttribute('interval'),
  }),
  '送葬人-最终旅程': () => ({ ATTACK_COUNT: 2 }),
  '吉星-欢迎您来！': ({ conditionEffectsEnabled, skillAttribute }) => ({
    atk: conditionEffectsEnabled
      ? skillAttribute('atk') * skillAttribute('max_stack_cnt')
      : 0,
  }),
  '天空盒-电磁脉冲恩宠': ({ skillAttribute }) => ({
    atk_scale: skillAttribute('attack@atk_scale'),
  }),
  '天火-天坠之火': ({ skillAttribute }) => ({
    atk_scale: skillAttribute('attack@atk_scale'),
  }),
  '寒檀-“女巫之泪”': ({ skillAttribute }) => ({
    atk_scale: skillAttribute('attack@atk_scale'),
  }),
  '复奏-直到终曲': ({ skillAttribute }) => ({
    CHANGE_duration: skillAttribute('liesel_s_2[dot].duration'),
    MAIN_times: 1,
    CHANGE_OTHER_attackType: '法術',
    OTHER_atk_scale: skillAttribute('liesel_s_2[dot].atk_scale')
      / skillAttribute('atk_scale'),
    OTHER_base_attack_time: 1,
    OTHER_duration: skillAttribute('liesel_s_2[dot].duration'),
  }),
  '薄绿-风语': ({ skillAttribute }) => ({
    atk_scale: skillAttribute('attack@atk_scale'),
  }),
  '爱丽丝-童话守卫者': ({ skillAttribute }) => ({
    atk_scale: skillAttribute('attack@atk_scale'),
  }),
  '和弦-轻巧舞步': ({ skillAttribute }) => ({
    atk_scale: skillAttribute('attack@atk_scale'),
  }),
  '戴菲恩-“贯注”': ({ skillAttribute }) => ({
    atk_scale: skillAttribute('attack@atk_scale'),
  }),
  '炎狱炎熔-狱火之环': ({ conditionEffectsEnabled, skillAttribute }) => ({
    ...stopAttacking(),
    CHANGE_OTHER_attackType: '法術',
    OTHER_atk_scale: skillAttribute('atk_scale'),
    OTHER_base_attack_time: skillAttribute('interval'),
    ATTACK_COUNT: conditionEffectsEnabled ? 2 : 1,
  }),
  '至简-神工意匠': () => ({ ATTACK_COUNT: 2 }),
  'Miss.Christine-狂饮之宴': ({ skillAttribute }) => ({
    ...stopAttacking(),
    CHANGE_OTHER_attackType: '法術',
    OTHER_atk_scale: skillAttribute('atk_scale'),
    OTHER_base_attack_time: skillAttribute('interval'),
  }),
  '亚叶-复合型药物弹片': ({ skillAttribute }) => ({
    CHANGE_attackType: '法術',
    atk_scale: skillAttribute('attack@atk_scale'),
  }),
  '临光-急救模式': stopAttacking,
  '吽-反制医疗模式': stopAttacking,
  '深律-沉音宁神': stopAttacking,
  '森西-单人份料理': stopAttacking,
  '森西-团体魔物大餐': stopAttacking,
  '卡夫卡-怪异魔方': ({ skillAttribute }) => ({
    ...stopAttacking(),
    CHANGE_duration: skillAttribute('duration'),
    CHANGE_OTHER_attackType: '法術',
    OTHER_atk_scale: skillAttribute('atk_scale'),
    OTHER_times: 1,
  }),
  '乌有-知难而退': stopAttacking,
  '裁度-缝线缠身': ({ skillAttribute }) => ({
    ...stopAttacking(),
    CHANGE_OTHER_attackType: '物理',
    OTHER_atk_scale: skillAttribute('atk_scale'),
    OTHER_base_attack_time: 1,
  }),
  '拜松-深化阵线': stopAttacking,
  '暴雨-群体迷彩': stopAttacking,
  '菲莱-冥河诅咒': stopAttacking,
  '熔泉-信号矢': ({ skillAttribute }) => ({
    atk_scale: skillAttribute('attack@atk_scale'),
  }),
  '熔泉-便携破城矢': ({ skillAttribute }) => ({
    atk_scale: skillAttribute('attack@atk_scale'),
    CHANGE_OTHER_attackType: '物理',
    OTHER_atk_scale: skillAttribute('attack@splash_atk_scale')
      / skillAttribute('attack@atk_scale'),
  }),
  '矩-良弓难张': ({ skillAttribute }) => ({
    atk_scale: skillAttribute('atk_scale_s1'),
  }),
  '矩-良翼难乘': ({ skillAttribute }) => ({
    CHANGE_OTHER_attackType: '物理',
    OTHER_atk_scale: skillAttribute('atk_scale_s2_extra'),
    OTHER_times: 1,
  }),
  '雪猎-风雪连弩': ({ conditionEffectsEnabled, skillAttribute }) => ({
    atk_scale: skillAttribute(conditionEffectsEnabled ? 'atk_scale_2' : 'atk_scale_1'),
    ATTACK_COUNT: 2,
  }),
  '巫恋-病入膏肓': (context) => {
    const baseDamageScale = memberTalentRaw(context, 'damage_scale');
    const enhancedDamageScale = 1 + (
      (baseDamageScale - 1) * context.skillAttribute('scale_delta_to_one')
    );
    return {
      damage_scale: context.conditionEffectsEnabled
        ? enhancedDamageScale / baseDamageScale
        : 1,
    };
  },
  '凯瑟琳-战火淬炼': stopAttacking,
  '三角初华-我思念的': () => ({
    CHANGE_attackType: '不攻擊',
  }),
  '三角初华-我悲悯的': ({ skillAttribute }) => ({
    CHANGE_attackType: '不攻擊',
    CHANGE_OTHER_attackType: '法術',
    OTHER_atk_scale: skillAttribute('attack@atk_scale'),
    OTHER_base_attack_time: skillAttribute('interval'),
  }),
  '月禾-森廻': stopAttacking,
  '波卜-“此路不通”': ({ skillAttribute }) => ({
    ...stopAttacking(),
    CHANGE_OTHER_attackType: '法術',
    OTHER_atk_scale: skillAttribute('atk_scale'),
    OTHER_base_attack_time: skillAttribute('interval'),
  }),
  '伯塔尼-谐波破坏': ({ conditionEffectsEnabled, skillAttribute }) => ({
    atk_scale: skillAttribute('atk_scale')
      + (conditionEffectsEnabled ? skillAttribute('botany_s1_extra.atk_scale') : 0),
  }),
  '伯塔尼-静域回声': ({ skillAttribute }) => ({
    CHANGE_OTHER_attackType: '物理',
    OTHER_atk_scale: skillAttribute('attack@extra_atk_scale'),
  }),
  '八幡海铃-颤栗之弦': () => ({
    CHANGE_attackType: '法術',
  }),
  '八幡海铃-无存之所': ({ skillAttribute }) => ({
    CHANGE_attackType: '不攻擊',
    CHANGE_OTHER_attackType: '法術',
    OTHER_atk_scale: skillAttribute('attack@atk_scale'),
    OTHER_base_attack_time: skillAttribute('attack@interval'),
  }),
  '若叶睦-破坏与滋养': ({ skillAttribute }) => ({
    CHANGE_attackType: '法術',
    atk_scale: skillAttribute('attack@atk_scale'),
    ATTACK_COUNT: 3,
  }),
  '鸿雪-抑扬格': ({ conditionalMultiplier }) => ({
    atk_scale: conditionalMultiplier('atk_scale'),
  }),
  '鸿雪-点题': () => ({ ATTACK_COUNT: 3 }),
  '焰狐龙梓兰-刚射': ({ conditionEffectsEnabled, skillAttribute }) => ({
    atk_scale: (4 * skillAttribute('atk_scale_1'))
      + (conditionEffectsEnabled ? 5 * skillAttribute('atk_scale_2') : 0),
    times: 1,
  }),
  '焰狐龙梓兰-飞翔瞪射': ({ skillAttribute }) => ({
    atk_scale: (12 * skillAttribute('attack@atk_scale_loop'))
      + skillAttribute('attack@atk_scale_end'),
    times: 1,
  }),
  '焰狐龙梓兰-龙之箭': ({ skillAttribute }) => ({
    CHANGE_OTHER_attackType: '法術',
    OTHER_atk_scale: skillAttribute('atk_scale_magic') / skillAttribute('atk_scale'),
    times: 1,
  }),
  '蕾缪安-归乡邀约': ({ skillAttribute }) => ({
    atk_scale: skillAttribute('attack@fin_atk_scale'),
  }),
  '蕾缪安-礼炮·强制追思': ({ skillAttribute }) => ({
    ...stopAttacking(),
    CHANGE_OTHER_attackType: '物理',
    OTHER_atk_scale: skillAttribute('attack@proj_atk_scale_1'),
  }),
  '莱伊-“得见光芒”': ({ skillAttribute }) => ({
    atk_scale: skillAttribute('attack@atk_scale'),
  }),
  '娜仁图亚-旋刃': ({ skillAttribute }) => ({
    atk_scale: skillAttribute('attack@atk_scale'),
  }),
  '风笛-高效冲击': () => ({ ATTACK_COUNT: 2 }),
  '风笛-闭膛连发': () => ({ ATTACK_COUNT: 3 }),
  '琴柳-支援号令·γ型': stopAttacking,
  '琴柳-信仰传承': stopAttacking,
  '琴柳-光辉旗帜': ({ skillAttribute }) => ({
    ...stopAttacking(),
    CHANGE_OTHER_attackType: '物理',
    OTHER_atk_scale: skillAttribute('atk_scale'),
    OTHER_times: 1,
  }),
  '伺夜-领袖的尊严': ({ conditionEffectsEnabled, skillAttribute }) => ({
    ATTACK_COUNT: 3,
    ...(conditionEffectsEnabled ? {
      CHANGE_OTHER_attackType: '法術',
      OTHER_atk_scale: skillAttribute('attack@vigil_s_3.atk_scale'),
    } : {}),
  }),
  '凛御银灰-周旋的谋略': () => ({
    CHANGE_attackType: '不攻擊',
  }),
  '凛御银灰-变革已至': ({ skillAttribute }) => ({
    atk_scale: skillAttribute('bird_atk_scale'),
  }),
  '艾雅法拉-二重咏唱': ({ skillAttribute }) => ({
    atk: skillAttribute('amgoat_s_1[b].atk'),
    attack_speed: skillAttribute('amgoat_s_1[b].attack_speed'),
  }),
  '逻各斯-提喻': ({ skillAttribute }) => ({
    CHANGE_attackType: '不攻擊',
    CHANGE_OTHER_attackType: '法術',
    OTHER_atk_scale: skillAttribute('attack@atk_scale_base')
      + (skillAttribute('attack@atk_scale_delta')
        * skillAttribute('attack@max_stack_cnt')),
    OTHER_base_attack_time: skillAttribute('attack@cooldown'),
  }),
  '玛露西尔-召唤使魔': ({ skillAttribute }) => ({
    attack_speed: skillAttribute('attack_speed'),
  }),
  '卡涅利安-食噬之印': ({ skillAttribute }) => ({
    damage_scale: 1 + (skillAttribute('attack@damage_scale') * 5),
  }),
  '圣聆初雪-霜涛覆岭': ({ skillAttribute }) => ({
    atk_scale: skillAttribute('attack@atk_scale_s2'),
  }),
  '圣聆初雪-群山俯首': ({ skillAttribute }) => ({
    atk_scale: skillAttribute('attack@atk_scale_s3'),
    magic_resistance: -skillAttribute('magic_resist_penetrate_fixed'),
  }),
  '维伊-“以鲜血洗去”': ({ conditionEffectsEnabled, skillAttribute }) => ({
    atk: conditionEffectsEnabled
      ? skillAttribute('attack@veen_s_2_buff[stack].atk')
        * skillAttribute('attack@veen_s_2_buff[stack].max_stack_cnt')
      : 0,
    attack_speed: conditionEffectsEnabled
      ? skillAttribute('attack@veen_s_2_buff[stack].attack_speed')
        * skillAttribute('attack@veen_s_2_buff[stack].max_stack_cnt')
      : 0,
  }),
  '真言-意识联协': ({ skillAttribute }) => ({
    atk_scale: skillAttribute('attack@atk_scale'),
  }),
  '真言-无言为真': () => ({
    atk_scale: 1,
  }),
  '灵知-高速思考': () => ({ ATTACK_COUNT: 2 }),
  '铃兰-狐火渺然': () => ({
    CHANGE_attackType: '不攻擊',
  }),
  '溯光星源-星束引力': ({ skillAttribute }) => ({
    atk_scale: skillAttribute('atk_scale'),
  }),
  '遥-幽隙栖萤': ({ skillAttribute }) => ({
    atk: skillAttribute('atk'),
  }),
  '遥-夏末游鳞': ({ skillAttribute }) => ({
    CHANGE_OTHER_attackType: '法術',
    OTHER_atk_scale: skillAttribute('atk_scale'),
    OTHER_base_attack_time: skillAttribute('interval'),
  }),
  '娜斯提-“执行”': () => ({
    CHANGE_attackType: '不攻擊',
  }),
  '塑心-“自由的探戈”': stopAttacking,
  '麒麟R夜刀-鬼人化': () => ({ ATTACK_COUNT: 10 / 3 }),
  '弑君者-硝烟震爆': ({ skillAttribute }) => ({
    ...stopAttacking(),
    CHANGE_duration: skillAttribute('duration'),
    CHANGE_OTHER_attackType: '物理',
    OTHER_atk_scale: skillAttribute('attack@atk_scale_s2'),
    OTHER_times: 1,
  }),
  '老鲤-驱凶辟邪': ({ skillAttribute }) => ({
    CHANGE_attackType: '不攻擊',
    DISABLE_TRAIT_EXTRA: 1,
    CHANGE_duration: skillAttribute('paper_duration'),
    CHANGE_OTHER_attackType: '法術',
    OTHER_atk_scale: skillAttribute('default_atk_scale')
      + (skillAttribute('factor_atk_scale') * skillAttribute('max_stack_cnt')),
    OTHER_times: 1,
  }),
  '琳琅诗怀雅-千金一掷': () => ({ ATTACK_COUNT: 2 }),
  '新约能天使-天空大扫除': ({ skillAttribute }) => ({
    atk_scale: skillAttribute('attack@atk_scale'),
  }),
  '新约能天使-开火成瘾症': ({ skillAttribute }) => ({
    atk_scale: skillAttribute('attack@atk_scale'),
    'attack@trigger_time': skillAttribute('attack@trigger_time')
      + skillAttribute('addtional_ammo_each'),
  }),
  '歌蕾蒂娅-缺水的掌握怒海': ({ skillAttribute }) => ({
    atk_scale: skillAttribute('attack@atk_scale'),
  }),
  '阿斯卡纶-追袭': () => ({ ATTACK_COUNT: 2 }),
  '望-取势': ({ skillAttribute }) => ({
    CHANGE_attackType: '不攻擊',
    CHANGE_duration: skillAttribute('attack@sluggish'),
    CHANGE_OTHER_attackType: '法術',
    OTHER_atk_scale: skillAttribute('attack@atk_scale'),
    OTHER_base_attack_time: 1,
  }),
  '望-连星': ({ skillAttribute }) => ({
    CHANGE_attackType: '不攻擊',
    CHANGE_OTHER_attackType: '法術',
    OTHER_atk_scale: skillAttribute('attack@atk_scale'),
    OTHER_times: 1,
  }),
  '望-天下劫': ({ skillAttribute }) => ({
    CHANGE_attackType: '不攻擊',
    CHANGE_OTHER_attackType: '法術',
    OTHER_atk_scale: 1,
    'attack@trigger_time': skillAttribute('trigger_time'),
  }),
  '焰影苇草-生命火种': ({ skillAttribute }) => ({
    atk: skillAttribute('reed2_skil_3[switch_mode].atk'),
  }),
  '缇缇-封护': () => ({
    CHANGE_attackType: '不攻擊',
  }),
  '凯尔希·思衡托-保护性拒止': ({ skillAttribute }) => ({
    CHANGE_attackType: '真實',
    atk_scale: skillAttribute('attack@atk_scale'),
  }),
  '瑕光-先贤化身': ({ skillAttribute }) => ({
    CHANGE_OTHER_attackType: '法術',
    OTHER_atk_scale: skillAttribute('attack@blemsh_s_3_extra_dmg[magic].atk_scale'),
  }),
  '黍-嘉禾盈仓': stopAttacking,
  '年-铜印': stopAttacking,
  '斥罪-坚心苦修': ({ skillAttribute }) => ({
    ...stopAttacking(),
    CHANGE_OTHER_attackType: '法術',
    OTHER_atk_scale: skillAttribute('atk_scale'),
    OTHER_base_attack_time: 1,
  }),
  '号角-终极防线': ({ skillAttribute }) => ({
    atk: skillAttribute('horn_s_3[overload_start].atk'),
  }),
  '信仰搅拌机-铳骑主考官': () => ({ ATTACK_COUNT: 3 }),
  '斩业星熊-无始无明': ({ skillAttribute }) => ({
    atk_scale: skillAttribute('attack@atk_scale'),
    ATTACK_COUNT: 3,
    times: 1,
  }),
  '斩业星熊-地狱变相': ({ conditionEffectsEnabled }) => ({
    ATTACK_COUNT: conditionEffectsEnabled ? 4 : 2,
  }),
  '重岳-我无': () => ({ ATTACK_COUNT: 3 }),
  '贝洛内-家主的余裕': () => ({
    ATTACK_COUNT: 2,
  }),
  '贝洛内-军师的手段': ({ skillAttribute }) => ({
    atk_scale: skillAttribute('attack@atk_scale'),
  }),
  '贝洛内-清算': ({ conditionEffectsEnabled, skillAttribute }) => ({
    atk: skillAttribute('attack@demetr_s3[bonus].atk'),
    attack_speed: skillAttribute('attack@demetr_s3[bonus].attack_speed'),
    atk_scale: conditionEffectsEnabled
      ? 1 + ((skillAttribute('attack@demetr_s3[bonus].prob_atk_scale') - 1)
        * skillAttribute('attack@demetr_s3[bonus].prob'))
      : 1,
  }),
  '棘刺-护身尖刺': stopAttacking,
  '棘刺-至高之术': ({ skillAttribute }) => ({
    atk: skillAttribute('thorns_s_3[b].atk'),
    attack_speed: skillAttribute('thorns_s_3[b].attack_speed'),
  }),
  '丰川祥子-新月的苏醒': ({ skillAttribute }) => ({
    CHANGE_attackType: '法術',
    atk_scale: ['atk_scale', 'atk_scale_2', 'atk_scale_3', 'atk_scale_4',
      'atk_scale_5', 'atk_scale_6', 'atk_scale_7', 'atk_scale_8']
      .reduce((sum, key) => sum + skillAttribute(key), 0),
    times: 1,
  }),
  '丰川祥子-残月的余响': ({ skillAttribute }) => ({
    atk_scale: skillAttribute('attack@atk_scale'),
    ATTACK_COUNT: 2,
    CHANGE_OTHER_attackType: '法術',
    OTHER_atk_scale: 1,
  }),
  '乌尔比安-必须维系的界限': (context) => ({
    FLAT_atk: memberTalentRaw(context, 'atk')
      * memberTalentRaw(context, 'max_stack_cnt')
      * (context.skillAttribute('talent_scale') - 1),
  }),
  '怒潮凛冬-绝不罢休': ({ skillAttribute }) => ({
    atk: skillAttribute('headb2_s_2[second].atk'),
  }),
  '怒潮凛冬-无可抵挡': ({ skillAttribute }) => ({
    atk: skillAttribute('atk_base'),
    // 五次锤击的攻击加成依次为 100%、130%、160%、190%、220%。
    atk_scale: skillAttribute('atk_scale') * (
      1 + skillAttribute('atk_step')
    ),
    ATTACK_COUNT: 5,
    times: 1,
  }),
  '艾丽妮-起风': () => ({ ATTACK_COUNT: 2 }),
  '锏-纯粹的武力': ({ skillAttribute }) => ({
    atk_scale: skillAttribute('atk_scale_s1'),
    ATTACK_COUNT: 2,
  }),
  '锏-归于宁静': ({ skillAttribute }) => ({
    atk_scale: (10 * skillAttribute('d_atk_scale'))
      + skillAttribute('e_atk_scale_end'),
    times: 1,
  }),
  '煌-沸腾爆裂': ({ skillAttribute }) => ({
    CHANGE_OTHER_attackType: '物理',
    OTHER_atk_scale: skillAttribute('damage_by_atk_scale'),
    OTHER_times: 1,
  }),
  '薇薇安娜-光影迅捷剑': () => ({ ATTACK_COUNT: 3 }),
  '薇薇安娜-烛燃影息': ({ conditionEffectsEnabled, skillAttribute }) => ({
    atk_scale: conditionEffectsEnabled
      ? (skillAttribute('attack@prob_once')
        + (skillAttribute('attack@prob_twice')
          * 2 * skillAttribute('attack@atk_scale_twice')))
      : 1,
  }),
  '薇薇安娜-“明灭”': ({ skillAttribute }) => ({
    ATTACK_COUNT: 3,
    CHANGE_duration: skillAttribute('enhance_duration'),
  }),
  '赤刃明霄陈-赤霄·奔夜': () => ({
    ATTACK_COUNT: 2,
  }),
  '赤刃明霄陈-赤霄·绝影-驰': () => ({
    times: 10,
  }),
  '赤刃明霄陈-赤霄·天喟': ({ skillAttribute }) => ({
    atk_scale: skillAttribute('attack@atk_scale'),
    ATTACK_COUNT: 3,
  }),
  '赫拉格-新月': () => ({ ATTACK_COUNT: 2 }),
  '赫拉格-弦月': () => ({ ATTACK_COUNT: 2 }),
  '左乐-破虏': () => ({ ATTACK_COUNT: 3 }),
  '帕拉斯-胜利的连击': () => ({ ATTACK_COUNT: 2 }),
  '止颂-苦修破誓': ({ skillAttribute }) => ({
    atk_scale: skillAttribute('lessng_s3[atk_scale].atk_scale'),
  }),
  '隐德来希-玫影觅迹': () => ({ ATTACK_COUNT: 2 }),
  '隐德来希-绯红壁合': ({ skillAttribute }) => ({
    ...stopAttacking(),
    CHANGE_OTHER_attackType: '物理',
    OTHER_atk_scale: skillAttribute('atk_scale'),
    OTHER_base_attack_time: skillAttribute('interval'),
  }),
  '玛恩纳-未声张的怒火': ({ skillAttribute }) => ({
    atk_scale: skillAttribute('attack@atk_scale'),
  }),
  '玛恩纳-未宽解的悲哀': ({ skillAttribute }) => ({
    atk_scale: skillAttribute('attack@atk_scale'),
    ATTACK_COUNT: 2,
  }),
  '玛恩纳-未照耀的荣光': ({ skillAttribute }) => ({
    atk_scale: skillAttribute('attack@atk_scale'),
    CHANGE_OTHER_attackType: '真實',
    OTHER_atk_scale: skillAttribute('atk_scale')
      / skillAttribute('attack@atk_scale'),
  }),
  '响石-震撼型指路': ({ skillAttribute }) => ({
    CHANGE_duration: skillAttribute('buff_duration'),
    CHANGE_OTHER_attackType: '法術',
    OTHER_atk_scale: skillAttribute('atk_scale'),
    OTHER_base_attack_time: 1,
  }),
  '断罪者-断罪': ({ skillAttribute }) => ({
    atk_scale: skillAttribute('atk_scale_fake'),
  }),
  '断罪者-创世纪': ({ skillAttribute }) => ({
    CHANGE_attackType: '法術',
    atk_scale: skillAttribute('success.atk_scale'),
  }),
  '月见夜-武器附魔·α型': () => ({
    CHANGE_attackType: '法術',
  }),
  '猎蜂-急速拳': ({ skillAttribute }) => ({
    base_attack_time: 0.78 * skillAttribute('base_attack_time'),
  }),
  '杰克-全神贯注！': () => ({
    CHANGE_attackType: '不攻擊',
  }),
  '可露希尔-Q.E.D.': ({ skillAttribute }) => ({
    atk_scale: skillAttribute('attack@atk_scale'),
  }),
};

const emptyEffects = Object.freeze({});
const conditionalSkillEffects = new Set([
  '协律-震爆调谐',
  '战车-倾泻弹药',
  '哈蒂娅-沙地战术改良',
  '吉星-欢迎您来！',
  '炎狱炎熔-狱火之环',
  '雪猎-风雪连弩',
  '伯塔尼-谐波破坏',
  '鸿雪-抑扬格',
  '焰狐龙梓兰-刚射',
  '伺夜-领袖的尊严',
  '维伊-“以鲜血洗去”',
  '斩业星熊-地狱变相',
  '贝洛内-清算',
  '薇薇安娜-烛燃影息',
]);

const SkillEffectRulesModel = {
  hasConditionalEffect: (checkName) => conditionalSkillEffects.has(checkName),

  resolve: (checkName, context) => {
    const createEffects = skillEffectRuleFactories[checkName];
    return createEffects?.(context) ?? emptyEffects;
  },
};

export default SkillEffectRulesModel;
