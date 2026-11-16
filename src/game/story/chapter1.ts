import type { StoryChapter, StoryContext } from './storyTypes';

/**
 * Chương 1 — "Lên phố"
 * Bạn là tân sinh viên rời Bình Lục (Hà Nam) lên Hà Nội nhập học Đại học Thương Mại.
 * Trên chuyến xe Bánh mì 168 → BX Mỹ Đình, những người lạ dần trở thành người quen.
 */

const N = '📖'; // narrator portrait
const flag = (ctx: StoryContext, name: string) => Boolean(ctx.flags[name]);
const count = (ctx: StoryContext, name: string) => Number(ctx.flags[name] ?? 0);

export const CHAPTER_1: StoryChapter = {
  id: 'ch1-len-pho',
  title: 'Chương 1: Lên phố',
  subtitle: 'Bình Lục → Bến xe Mỹ Đình',
  synopsis:
    'Lần đầu rời quê lên Hà Nội nhập học, bạn mang theo túi bánh mì 168 mẹ mua và một chút bồn chồn. 72 cây số, vài người lạ, và những câu chuyện nhỏ trên một chuyến xe khách.',
  initialFlags: { banhMi: 5 },

  dialogues: {
    intro: {
      id: 'intro',
      start: 'a',
      nodes: {
        a: {
          speaker: 'Dẫn truyện',
          portrait: N,
          text: 'Sáng sớm ở Ngã tư 168 Bình Lục. Mùi bánh mì nướng vẫn còn vương trên tay áo bạn.',
          next: 'b',
        },
        b: {
          speaker: 'Mẹ',
          portrait: '👩',
          text: 'Lên đến nơi nhớ gọi về cho mẹ. Mẹ mua năm cái bánh mì, con chia cho mọi người trên xe nữa nhé.',
          next: 'c',
        },
        c: {
          speaker: 'Dẫn truyện',
          portrait: N,
          text: 'Hôm nay bạn rời quê, lên Hà Nội nhập học. Chuyến xe này sẽ đưa bạn tới Bến xe Mỹ Đình, cách nhà 72 cây số.',
          next: null,
        },
      },
      onEnd: [
        { type: 'addObjective', id: 'find-seat' },
        { type: 'journal', text: 'Rời Ngã tư 168 Bình Lục với túi bánh mì mẹ mua.' },
      ],
    },

    nam: {
      id: 'nam',
      start: 'a',
      nodes: {
        a: {
          speaker: 'Bác Hoàng Nam',
          portrait: '👨‍🌾',
          text: 'Cháu cũng người Bình Lục à? Nhìn cái túi bánh mì 168 là bác biết ngay!',
          choices: [
            {
              label: 'Dạ, cháu mời bác một cái bánh mì ạ.',
              next: 'share',
              requires: (ctx) => count(ctx, 'banhMi') > 0,
              effects: [
                { type: 'addFlag', flag: 'banhMi', delta: -1 },
                { type: 'setFlag', flag: 'sharedWithNam' },
                { type: 'relationship', npcId: 'p2', delta: 2 },
                { type: 'emote', npcId: 'p2', emote: 'Laugh' },
              ],
            },
            {
              label: 'Dạ, cháu lên Hà Nội nhập học ạ.',
              next: 'school',
              effects: [{ type: 'relationship', npcId: 'p2', delta: 1 }],
            },
          ],
        },
        share: {
          speaker: 'Bác Hoàng Nam',
          portrait: '👨‍🌾',
          text: 'Ôi quý hoá quá! Thế bác đổi cho cháu nải chuối Ngự này, mang lên cho bạn cùng phòng nhé.',
          effects: [{ type: 'setFlag', flag: 'gotChuoiNgu' }],
          next: 'bridge',
        },
        school: {
          speaker: 'Bác Hoàng Nam',
          portrait: '👨‍🌾',
          text: 'Giỏi quá! Thằng cháu bác hồi trước cũng đi chuyến này lên trường. Mấy hôm đầu nó nhớ nhà lắm, rồi cũng quen.',
          next: 'bridge',
        },
        bridge: {
          speaker: 'Bác Hoàng Nam',
          portrait: '👨‍🌾',
          text: 'Sắp qua cầu sông Đáy rồi đấy. Ngắm ra cửa sổ đi cháu, đẹp lắm.',
          next: null,
        },
      },
      onEnd: [
        { type: 'completeObjective', id: 'greet-nam' },
        { type: 'addObjective', id: 'watch-bridge' },
      ],
    },

    bridge: {
      id: 'bridge',
      start: 'a',
      nodes: {
        a: {
          speaker: 'Dẫn truyện',
          portrait: N,
          text: 'Dưới cầu, mấy con thuyền nhỏ neo dọc bờ sông Đáy. Nước sông lặng, phản chiếu cả bầu trời.',
          next: 'b',
        },
        b: {
          speaker: 'Dẫn truyện',
          portrait: N,
          text: 'Hồi bé, bố hay chở bạn qua đây trên chiếc Cub cũ, chỉ cho bạn từng con thuyền. Giờ bạn đi một mình.',
          next: null,
        },
      },
      onEnd: [
        { type: 'setFlag', flag: 'sawBridge' },
        { type: 'journal', text: 'Qua cầu sông Đáy, nhớ những lần bố chở đi trên chiếc Cub cũ.' },
      ],
    },

    khoa: {
      id: 'khoa',
      start: 'a',
      nodes: {
        a: {
          speaker: 'Anh Văn Khoa',
          portrait: '🧑‍🎓',
          text: 'Tân sinh viên Thương Mại à? Anh năm ba rồi. Đi nhập học một mình hả em?',
          choices: [
            {
              label: 'Dạ vâng, em hơi lo vì chưa quen ai cả.',
              next: 'worry',
              effects: [
                { type: 'setFlag', flag: 'khoaMentor' },
                { type: 'relationship', npcId: 'p6', delta: 2 },
              ],
            },
            {
              label: 'Em mời anh bánh mì 168 ạ!',
              next: 'share',
              requires: (ctx) => count(ctx, 'banhMi') > 0,
              effects: [
                { type: 'addFlag', flag: 'banhMi', delta: -1 },
                { type: 'setFlag', flag: 'khoaMentor' },
                { type: 'setFlag', flag: 'sharedWithKhoa' },
                { type: 'relationship', npcId: 'p6', delta: 3 },
                { type: 'emote', npcId: 'p6', emote: 'Clap' },
              ],
            },
            {
              label: 'Dạ không sao, em tự lo được ạ.',
              next: 'alone',
              effects: [{ type: 'relationship', npcId: 'p6', delta: 1 }],
            },
          ],
        },
        worry: {
          speaker: 'Anh Văn Khoa',
          portrait: '🧑‍🎓',
          text: 'Năm nhất ai chẳng thế. Mai anh dẫn em đi làm thủ tục, chỉ cho em chỗ gửi xe với căng tin ngon nhất.',
          next: null,
        },
        share: {
          speaker: 'Anh Văn Khoa',
          portrait: '🧑‍🎓',
          text: 'Đúng vị quê nhà! Ăn bánh mì của em rồi thì anh phải dẫn em đi ăn bún chả Cầu Giấy mới được.',
          next: null,
        },
        alone: {
          speaker: 'Anh Văn Khoa',
          portrait: '🧑‍🎓',
          text: 'Tự lập là tốt. Nhưng có gì đừng ngại hỏi nhé, người Bình Lục với nhau cả.',
          next: null,
        },
      },
      onEnd: [
        { type: 'completeObjective', id: 'talk-khoa' },
        { type: 'reward', key: 'story-ch1-khoa', coins: 50, reason: 'Cốt truyện: Làm quen anh Văn Khoa' },
      ],
    },

    scarf: {
      id: 'scarf',
      start: 'a',
      nodes: {
        a: {
          speaker: 'Dẫn truyện',
          portrait: N,
          text: 'Có chiếc khăn len màu xanh rơi dưới lối đi, cạnh ghế 3D. Hình như là của chị Lan Hương, chị ấy sẽ xuống ở nút giao Pháp Vân.',
          next: null,
        },
      },
      onEnd: [{ type: 'addObjective', id: 'return-scarf' }],
    },

    lanhuong: {
      id: 'lanhuong',
      start: 'a',
      nodes: {
        a: {
          speaker: 'Chị Lan Hương',
          portrait: '👩‍⚕️',
          text: 'Ôi, khăn của chị! Mẹ chị đan cho đấy, mất thì tiếc lắm. Cảm ơn em nhiều nhé.',
          next: 'b',
        },
        b: {
          speaker: 'Chị Lan Hương',
          portrait: '👩‍⚕️',
          text: 'Em lưu số chị đi. Chị làm ở Bạch Mai, ở Hà Nội có ốm đau gì cứ gọi chị.',
          next: null,
        },
      },
      onEnd: [
        { type: 'setFlag', flag: 'helpedLanHuong' },
        { type: 'relationship', npcId: 'p5', delta: 3 },
        { type: 'emote', npcId: 'p5', emote: 'Wave' },
        { type: 'completeObjective', id: 'return-scarf' },
        { type: 'reward', key: 'story-ch1-scarf', coins: 80, reason: 'Cốt truyện: Trả khăn cho chị Lan Hương' },
      ],
    },

    'mom-call': {
      id: 'mom-call',
      start: 'a',
      nodes: {
        a: {
          speaker: 'Dẫn truyện',
          portrait: N,
          text: 'Những toà nhà cao tầng hiện ra sau màn sương sớm. Điện thoại trong túi rung lên. Là mẹ.',
          next: 'b',
        },
        b: {
          speaker: 'Mẹ',
          portrait: '👩',
          text: 'Đến đâu rồi con? Có say xe không? Bánh mì ăn chưa?',
          choices: [
            {
              label: 'Con sắp tới rồi mẹ ạ. Trên xe mọi người tốt lắm.',
              next: 'calm',
              effects: [{ type: 'setFlag', flag: 'reassuredMom' }],
            },
            {
              label: 'Con hơi sợ mẹ ạ... Hà Nội to quá.',
              next: 'fear',
              effects: [{ type: 'setFlag', flag: 'admittedFear' }],
            },
          ],
        },
        calm: {
          speaker: 'Mẹ',
          portrait: '👩',
          text: 'Thế thì mẹ yên tâm. Nhớ ăn uống đầy đủ, tối gọi video cho cả nhà nhé.',
          next: null,
        },
        fear: {
          speaker: 'Mẹ',
          portrait: '👩',
          text: 'Sợ cũng được con ạ. Ai rời nhà lần đầu cũng thế. Mẹ với bố lúc nào cũng ở đây.',
          next: null,
        },
      },
      onEnd: [
        { type: 'addObjective', id: 'arrive' },
        { type: 'journal', text: 'Mẹ gọi điện khi xe vào địa phận Hà Nội.' },
      ],
    },

    'ending-warm': {
      id: 'ending-warm',
      start: 'a',
      nodes: {
        a: {
          speaker: 'Kết thúc: Một khởi đầu ấm áp',
          portrait: '🌅',
          text: 'Bạn bước xuống Bến xe Mỹ Đình với lời hẹn bún chả của anh Khoa, số điện thoại của chị Lan Hương và những câu chuyện của bác Nam. Hà Nội vẫn lạ, nhưng bạn không còn một mình.',
          next: null,
        },
      },
    },
    'ending-friends': {
      id: 'ending-friends',
      start: 'a',
      nodes: {
        a: {
          speaker: 'Kết thúc: Những người quen đầu tiên',
          portrait: '🚌',
          text: 'Bến xe Mỹ Đình đông nghịt người. Bạn kéo vali đi giữa dòng người vội vã, nhưng trong danh bạ đã có thêm vài cái tên mới. Một khởi đầu nhỏ, mà vẫn là khởi đầu.',
          next: null,
        },
      },
    },
    'ending-alone': {
      id: 'ending-alone',
      start: 'a',
      nodes: {
        a: {
          speaker: 'Kết thúc: Hà Nội còn xa lạ',
          portrait: '🌆',
          text: 'Bạn xuống xe một mình giữa tiếng còi và tiếng gọi khách. Chuyến xe qua nhanh hơn bạn tưởng. Có lẽ lần sau, bạn sẽ là người mở lời trước.',
          next: null,
        },
      },
    },
  },

  objectives: {
    'find-seat': {
      id: 'find-seat',
      title: 'Tìm chỗ ngồi',
      detail: 'Bấm vào một ghế trống để đi tới và ngồi xuống.',
      target: { type: 'condition' },
      completeWhen: (ctx) => ctx.playerSitting,
      onComplete: [
        { type: 'addObjective', id: 'greet-nam' },
        { type: 'npcSay', npcId: 'p2', speaker: 'Hoàng Nam', text: 'Cháu ơi, người Bình Lục à? Lên đây bác hỏi chuyện tí!' },
      ],
    },
    'greet-nam': {
      id: 'greet-nam',
      title: 'Chào bác Hoàng Nam',
      detail: 'Bác Hoàng Nam ngồi ghế 1D, đầu xe. Lại gần và bấm E, hoặc bấm vào bác.',
      target: { type: 'talk', npcId: 'p2', dialogueId: 'nam' },
    },
    'watch-bridge': {
      id: 'watch-bridge',
      title: 'Ngắm cầu sông Đáy',
      detail: 'Xe sắp qua cầu sông Đáy ở Phủ Lý.',
      target: { type: 'condition' },
      completeWhen: (ctx) => flag(ctx, 'sawBridge'),
    },
    'stall-break': {
      id: 'stall-break',
      title: 'Nghỉ chân ở trạm Liêm Tuyền',
      detail: 'Xuống xe và mua một ly nước mía ở quầy ven đường (E).',
      optional: true,
      target: { type: 'condition' },
      completeWhen: (ctx) => ctx.visitedStall,
      failWhen: (ctx) => ctx.stopIndex >= 1 && ctx.stage === 'in_transit',
      onComplete: [{ type: 'reward', key: 'story-ch1-stall', coins: 20, reason: 'Cốt truyện: Nghỉ chân ở Liêm Tuyền' }],
    },
    'talk-khoa': {
      id: 'talk-khoa',
      title: 'Hỏi anh Văn Khoa về trường',
      detail: 'Anh Văn Khoa (ghế 4A) đeo huy hiệu Đại học Thương Mại, đúng trường bạn sắp nhập học.',
      target: { type: 'talk', npcId: 'p6', dialogueId: 'khoa' },
    },
    'return-scarf': {
      id: 'return-scarf',
      title: 'Trả khăn cho chị Lan Hương',
      detail: 'Chị Lan Hương ngồi ghế 3D và sẽ xuống ở nút giao Pháp Vân. Hãy trả khăn trước khi xe rời trạm.',
      target: { type: 'talk', npcId: 'p5', dialogueId: 'lanhuong' },
      failWhen: (ctx) => ctx.stopIndex >= 2 && ctx.stage === 'in_transit',
      onFail: [
        { type: 'setFlag', flag: 'keptScarf' },
        { type: 'journal', text: 'Chị Lan Hương đã xuống xe ở Pháp Vân. Chiếc khăn len vẫn nằm trong balo bạn.' },
        { type: 'toast', text: 'Chị Lan Hương đã xuống xe... Chiếc khăn vẫn còn trong balo bạn.' },
      ],
    },
    arrive: {
      id: 'arrive',
      title: 'Đến Bến xe Mỹ Đình',
      detail: 'Chặng cuối dọc đường Phạm Hùng.',
      target: { type: 'condition' },
      completeWhen: (ctx) => ctx.stage === 'completed',
    },
  },

  beats: [
    {
      id: 'intro',
      when: (ctx) => ctx.stopIndex === 0 && ctx.stage === 'in_transit',
      actions: [{ type: 'dialogue', id: 'intro' }],
    },
    {
      id: 'bridge',
      when: (ctx) => ctx.landmarkNear === 'song-day',
      actions: [
        {
          type: 'cinematic',
          position: [16, 7, -34],
          target: [0, 1.6, 2],
          durationSec: 6,
          caption: 'Cầu sông Đáy · TP. Phủ Lý',
        },
        { type: 'dialogue', id: 'bridge' },
      ],
    },
    {
      id: 'liem-tuyen-break',
      when: (ctx) => ctx.stopIndex === 1 && ctx.stage === 'at_station',
      actions: [{ type: 'addObjective', id: 'stall-break' }],
    },
    {
      id: 'khoa-hint',
      when: (ctx) =>
        ctx.km >= 18 && ctx.stopIndex >= 1 && ctx.stage === 'in_transit' && ctx.completedObjectives.includes('find-seat'),
      actions: [
        { type: 'addObjective', id: 'talk-khoa' },
        { type: 'toast', text: 'Anh Văn Khoa (ghế 4A) đeo huy hiệu Đại học Thương Mại, đúng trường bạn sắp nhập học!' },
      ],
    },
    {
      id: 'scarf',
      when: (ctx) => ctx.km >= 36 && ctx.stopIndex === 1 && ctx.stage !== 'at_station',
      actions: [{ type: 'dialogue', id: 'scarf' }],
    },
    {
      id: 'skyline',
      when: (ctx) => ctx.landmarkNear === 'skyline' || (ctx.km >= 62 && ctx.stopIndex >= 2),
      actions: [
        {
          type: 'cinematic',
          position: [-1.05, 2.0, 0.6],
          target: [-150, 70, -160],
          durationSec: 5,
          caption: 'Hà Nội',
        },
        { type: 'dialogue', id: 'mom-call' },
      ],
    },
    {
      id: 'arrival',
      when: (ctx) => ctx.stage === 'completed',
      actions: [{ type: 'ending' }],
    },
  ],

  resolveEnding: (ctx) => {
    const score =
      (flag(ctx, 'sharedWithNam') ? 1 : 0) +
      (flag(ctx, 'khoaMentor') ? 1 : 0) +
      (flag(ctx, 'helpedLanHuong') ? 1 : 0);
    if (score >= 3) return { id: 'warm', title: 'Một khởi đầu ấm áp', dialogueId: 'ending-warm' };
    if (score >= 1) return { id: 'friends', title: 'Những người quen đầu tiên', dialogueId: 'ending-friends' };
    return { id: 'alone', title: 'Hà Nội còn xa lạ', dialogueId: 'ending-alone' };
  },
};
