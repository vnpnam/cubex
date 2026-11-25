export interface AlgorithmItem {
  id: number;
  category: 'Beginner' | 'Cross' | 'F2L' | 'OLL' | 'PLL';
  subCategory: string;
  code: string;
  name: string;
  notation: string;
  alternativeNotation?: string;
  setupMoves?: string;
  descriptionVi: string;
  descriptionEn: string;
  executionTipVi: string;
  executionTipEn: string;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  orderIndex: number;
  diagramPattern?: string;
  userStatus?: 'Learning' | 'Practicing' | 'Mastered';
  isFavorite?: boolean;
  personalBestTimeMs?: number;
  practiceCount?: number;
}

export const INITIAL_ALGORITHMS: AlgorithmItem[] = [
  // ==================== BEGINNER METHOD ====================
  {
    id: 1,
    category: 'Beginner',
    subCategory: 'Daisy & White Cross',
    code: 'BEG-01',
    name: 'White Cross Orientation',
    notation: 'F2',
    alternativeNotation: 'R2 / L2 / B2',
    setupMoves: 'F2',
    descriptionVi: 'Xoay tầng chứa cạnh màu trắng thẳng hàng với tâm tương ứng rồi quay 180 độ (F2) đưa về đáy trắng.',
    descriptionEn: 'Match the white edge color with its side center, then turn 180 degrees (F2) into the white bottom.',
    executionTipVi: 'Nhìn màu tâm bên hông trước khi xoay F2 để tránh sai vị trí.',
    executionTipEn: 'Align the side color with the matching center before doing F2.',
    difficulty: 'Beginner',
    orderIndex: 1,
    userStatus: 'Mastered',
    isFavorite: true,
    practiceCount: 30,
    personalBestTimeMs: 450
  },
  {
    id: 2,
    category: 'Beginner',
    subCategory: 'First Layer Corners',
    code: 'BEG-02',
    name: 'The Sexy Move',
    notation: "R U R' U'",
    alternativeNotation: "(R U R' U') x3",
    setupMoves: "U R U' R'",
    descriptionVi: 'Công thức nền tảng 4 bước của Speedcubing dùng để giải góc tầng 1 và làm quen với fingertrick.',
    descriptionEn: 'The fundamental 4-move trigger in speedcubing used to slot first layer corners and build muscle memory.',
    executionTipVi: 'Dùng ngón trỏ phải để gảy U, ngón cái giữ cố định mặt F.',
    executionTipEn: 'Use your right index finger for the U push, keeping right thumb on F.',
    difficulty: 'Beginner',
    orderIndex: 2,
    userStatus: 'Mastered',
    isFavorite: true,
    practiceCount: 150,
    personalBestTimeMs: 520
  },
  {
    id: 3,
    category: 'Beginner',
    subCategory: 'Second Layer Edges',
    code: 'BEG-03',
    name: 'Right Edge Insertion',
    notation: "U R U' R' U' F' U F",
    alternativeNotation: "U (R U' R') (F R' F' R)",
    setupMoves: "F' U' F U R U R' U'",
    descriptionVi: 'Đưa viên cạnh từ tầng 3 vào khe bên phải của tầng 2 mà không làm xáo trộn tầng 1.',
    descriptionEn: 'Insert an edge from the top layer into the right front middle slot without disturbing layer 1.',
    executionTipVi: "Tách làm 2 cặp: (U R U' R') rồi xoay gảy ngón trỏ F' (U' F' U F).",
    executionTipEn: 'Split into 2 triggers: sexy pair push then sledgehammer/F turn.',
    difficulty: 'Beginner',
    orderIndex: 3,
    userStatus: 'Mastered',
    practiceCount: 45,
    personalBestTimeMs: 980
  },
  {
    id: 4,
    category: 'Beginner',
    subCategory: 'Second Layer Edges',
    code: 'BEG-04',
    name: 'Left Edge Insertion',
    notation: "U' L' U L U F U' F'",
    alternativeNotation: "y U' (R' U R) (F' R F R')",
    setupMoves: "F U F' U' L' U' L U",
    descriptionVi: 'Đưa viên cạnh từ tầng 3 vào khe bên trái của tầng 2.',
    descriptionEn: 'Insert an edge from the top layer into the left front middle slot.',
    executionTipVi: 'Đối xứng hoàn toàn với công thức bên phải, dùng tay trái thao tác.',
    executionTipEn: 'Exact mirror of right insertion, practice with your left hand.',
    difficulty: 'Beginner',
    orderIndex: 4,
    userStatus: 'Practicing',
    practiceCount: 30,
    personalBestTimeMs: 1120
  },
  {
    id: 5,
    category: 'Beginner',
    subCategory: 'Yellow Cross',
    code: 'BEG-05',
    name: "F-Sexy-F' (FRUR'U'F')",
    notation: "F R U R' U' F'",
    alternativeNotation: "F (R U R' U') F'",
    setupMoves: "F U R U' R' F'",
    descriptionVi: 'Biến hình chữ L hoặc đường thẳng màu vàng thành dấu cộng chữ thập màu vàng trên đỉnh.',
    descriptionEn: 'Turns an L-shape or horizontal line of yellow edges into a full yellow cross.',
    executionTipVi: "Mở mặt F bằng ngón cái phải, chạy Sexy Move rồi gạt F' về bằng ngón trỏ.",
    executionTipEn: "Thumb turn F, execute quick Sexy Move, snap F' back with right index.",
    difficulty: 'Beginner',
    orderIndex: 5,
    userStatus: 'Mastered',
    practiceCount: 60,
    personalBestTimeMs: 780
  },
  {
    id: 6,
    category: 'Beginner',
    subCategory: 'Last Layer Corners',
    code: 'BEG-06',
    name: 'Sune (Yellow Face)',
    notation: "R U R' U R U2 R'",
    alternativeNotation: "R U R' U R U2' R'",
    setupMoves: "R U2 R' U' R U' R'",
    descriptionVi: 'Định hướng tất cả các góc vàng lên trên khi đã có dấu thập vàng.',
    descriptionEn: 'Orients all yellow corners to face up once the yellow cross is formed.',
    executionTipVi: 'Gảy U2 bằng ngón trỏ kéo tiếp ngón giữa (double flick) cực nhanh.',
    executionTipEn: 'Execute U2 with an index-middle finger double flick for speed.',
    difficulty: 'Beginner',
    orderIndex: 6,
    userStatus: 'Mastered',
    practiceCount: 80,
    personalBestTimeMs: 690
  },

  // ==================== CROSS TRAINING ====================
  {
    id: 7,
    category: 'Cross',
    subCategory: 'Inspection & Planning',
    code: 'CRS-01',
    name: 'Direct 4-Move Cross',
    notation: "D R F' D'",
    alternativeNotation: "F R' D2 F'",
    setupMoves: "D F R' D'",
    descriptionVi: 'Giải chữ thập trắng trong 4 bước tối ưu từ mọi góc nhìn trong thời gian 15 giây quan sát.',
    descriptionEn: 'Optimal 4-move white cross planned completely during the 15-second inspection.',
    executionTipVi: 'Tập nhắm mắt sau 15 giây quan sát để thực hiện trơn tru mà không cần nhìn.',
    executionTipEn: 'Practice blind execution after inspection to train lookahead into F2L.',
    difficulty: 'Intermediate',
    orderIndex: 1,
    userStatus: 'Practicing',
    practiceCount: 40,
    personalBestTimeMs: 1250
  },
  {
    id: 8,
    category: 'Cross',
    subCategory: 'Color Neutrality',
    code: 'CRS-02',
    name: 'Opposite Cross (Yellow/White)',
    notation: "R2 D' F2 R B'",
    alternativeNotation: 'L F2 D R2',
    setupMoves: "B R' F2 D R2",
    descriptionVi: 'Luyện tập giải chữ thập vàng hoặc trắng tùy theo mặt nào có thế cờ ít bước hơn.',
    descriptionEn: 'Dual-color neutrality: choosing between white or yellow cross for fewer moves.',
    executionTipVi: 'Tiết kiệm trung bình 1.5 đến 2 giây cho bước khởi đầu.',
    executionTipEn: 'Saves an average of 1.5 to 2 moves in the initial cross solve.',
    difficulty: 'Advanced',
    orderIndex: 2,
    userStatus: 'Learning',
    practiceCount: 15
  },

  // ==================== CFOP: F2L (41 trường hợp chuẩn) ====================
  // Nhóm 1: Chèn cơ bản (1 - 4)
  {
    id: 9, category: 'F2L', subCategory: 'Basic Inserts', code: 'F2L 01',
    name: 'Trường hợp 1', notation: "U R U' R'", alternativeNotation: "y' U' R' U R",
    setupMoves: "R U R' U'",
    descriptionVi: 'Cặp góc-cạnh đã ghép sẵn trên tầng U, màu trắng hướng sang phải. Đưa ra sau rồi chèn vào khe phải.',
    descriptionEn: 'Paired corner-edge in U, white facing right. Insert into right slot.',
    executionTipVi: 'Thực hiện liền mạch bằng ngón trỏ phải và cổ tay.', executionTipEn: 'Smooth wrist and index finger trigger.',
    difficulty: 'Beginner', orderIndex: 1, userStatus: 'Mastered', practiceCount: 95, personalBestTimeMs: 510
  },
  {
    id: 10, category: 'F2L', subCategory: 'Basic Inserts', code: 'F2L 02',
    name: 'Trường hợp 2', notation: "y' U' R' U R", alternativeNotation: "F' U' F",
    setupMoves: "y' R' U' R U y",
    descriptionVi: 'Cặp góc-cạnh đã ghép sẵn trên tầng U, màu trắng hướng về phía trước. Xoay y\' hoặc dùng F\' U\' F để chèn.',
    descriptionEn: 'Paired corner-edge in U, white facing front.',
    executionTipVi: "Có thể dùng F' U' F để không cần đổi hướng cầm khối (regripless).", executionTipEn: "Use F' U' F to avoid y' rotation.",
    difficulty: 'Beginner', orderIndex: 2, userStatus: 'Mastered', practiceCount: 75, personalBestTimeMs: 620
  },
  {
    id: 11, category: 'F2L', subCategory: 'Basic Inserts', code: 'F2L 03',
    name: 'Trường hợp 3', notation: "y' R' U' R", alternativeNotation: "F' U' F (sau khi U')",
    setupMoves: "y' R' U R y",
    descriptionVi: 'Góc và cạnh ở vị trí chuẩn bị ghép nhanh bên trái. Xoay y\' rồi đưa thẳng vào khe chỉ với 3 bước.',
    descriptionEn: 'Basic 3-move insert after y\' rotation.',
    executionTipVi: 'Nước chèn 3 bước cơ bản cực nhanh.', executionTipEn: 'Fast 3-move basic insert.',
    difficulty: 'Beginner', orderIndex: 3, userStatus: 'Mastered', practiceCount: 60, personalBestTimeMs: 580
  },
  {
    id: 12, category: 'F2L', subCategory: 'Basic Inserts', code: 'F2L 04',
    name: 'Trường hợp 4', notation: "R U R'", alternativeNotation: "R U R'",
    setupMoves: "R U' R'",
    descriptionVi: 'Góc và cạnh nằm sẵn ở vị trí ghép trực tiếp bên phải. Chèn ngay lập tức chỉ với 3 bước R U R\'.',
    descriptionEn: 'Direct 3-move right slot insert.',
    executionTipVi: 'Trường hợp F2L nhanh và dễ nhất.', executionTipEn: 'Fastest and easiest F2L trigger.',
    difficulty: 'Beginner', orderIndex: 4, userStatus: 'Mastered', practiceCount: 55, personalBestTimeMs: 600
  },
  // Nhóm 2: Góc và cạnh trên tầng U - Trắng hướng ngang (5 - 14)
  {
    id: 100, category: 'F2L', subCategory: 'Corner in U & Edge in U', code: 'F2L 05',
    name: 'Trường hợp 5', notation: "U' R U' R' U y' R' U' R", alternativeNotation: "U' R U' R' U F' U' F",
    setupMoves: "y' R' U R y U' R U R' U",
    descriptionVi: 'Góc trắng hướng trước, cạnh nằm phía sau cùng màu mặt trên. Tách góc rồi xoay y\' chèn vào khe.',
    descriptionEn: 'Corner white front, edge at back with matching top color.',
    executionTipVi: 'Có thể kết thúc bằng F\' U\' F để tiết kiệm thời gian xoay khối.', executionTipEn: 'Finish with F\' U\' F to avoid cube rotation.',
    difficulty: 'Intermediate', orderIndex: 5
  },
  {
    id: 101, category: 'F2L', subCategory: 'Corner in U & Edge in U', code: 'F2L 06',
    name: 'Trường hợp 6', notation: "U' R U R' U R U R'", alternativeNotation: "R U' R' U R U' R' U2 R U' R'",
    setupMoves: "R U' R' U' R U' R' U",
    descriptionVi: 'Góc trắng hướng phải, cạnh ở bên trái cùng màu mặt trên. Đưa góc xuống để ghép cặp rồi chèn R U R\'.',
    descriptionEn: 'Corner white right, edge on left with matching top color.',
    executionTipVi: 'Thuật toán 2-gen (chỉ dùng R và U) cực kỳ mượt tay.', executionTipEn: 'Pure 2-gen R/U algorithm, very fast.',
    difficulty: 'Beginner', orderIndex: 6
  },
  {
    id: 102, category: 'F2L', subCategory: 'Corner in U & Edge in U', code: 'F2L 07',
    name: 'Trường hợp 7', notation: "U' R U2 R' U y' R' U' R", alternativeNotation: "U' R U2 R' U F' U' F",
    setupMoves: "y' R' U R y U' R U2 R' U",
    descriptionVi: 'Góc và cạnh dính nhau trên tầng U nhưng ngược hướng, màu trắng hướng trước. Tách bằng U2 rồi chèn.',
    descriptionEn: 'Corner and edge adjacent in U, white facing front, same top color.',
    executionTipVi: 'Dùng double-flick cho bước U2.', executionTipEn: 'Use double-flick for U2.',
    difficulty: 'Intermediate', orderIndex: 7
  },
  {
    id: 103, category: 'F2L', subCategory: 'Corner in U & Edge in U', code: 'F2L 08',
    name: 'Trường hợp 8', notation: "R' U2 R2 U R2 U R", alternativeNotation: "y' U R' U2 R U' y R U R'",
    setupMoves: "R' U' R2 U' R2 U2 R",
    descriptionVi: 'Góc và cạnh dính nhau phía trước trên tầng U, trắng hướng phải. Dùng công thức R\' U2 R2 siêu tốc không cần xoay khối.',
    descriptionEn: 'Adjacent in U, white facing right. Fast rotationless R2 trick.',
    executionTipVi: 'Công thức không xoay khối rất được các pro ưa chuộng.', executionTipEn: 'Popular rotationless pro algorithm.',
    difficulty: 'Intermediate', orderIndex: 8
  },
  {
    id: 104, category: 'F2L', subCategory: 'Corner in U & Edge in U', code: 'F2L 09',
    name: 'Trường hợp 9', notation: "y' U R' U R U' R' U' R", alternativeNotation: "U F' U F U' F' U' F",
    setupMoves: "y' R' U R U R' U' R U' y",
    descriptionVi: 'Góc và cạnh dính nhau phía trước, trắng hướng trước, màu trên cùng nhau. Xoay y\' rồi tách-ghép 2-gen.',
    descriptionEn: 'Adjacent front in U, white facing front. Mirror of Case 6.',
    executionTipVi: 'Đối xứng hoàn toàn với Trường hợp 10.', executionTipEn: 'Direct mirror of Case 10.',
    difficulty: 'Intermediate', orderIndex: 9
  },
  {
    id: 105, category: 'F2L', subCategory: 'Corner in U & Edge in U', code: 'F2L 10',
    name: 'Trường hợp 10', notation: "U' R U' R' U R U R'", alternativeNotation: "U' (R U' R') U (R U R')",
    setupMoves: "R U' R' U' R U R' U",
    descriptionVi: 'Góc và cạnh dính nhau bên phải, trắng hướng phải, màu trên khác nhau. Tách ra và ghép lại bằng R U R\'.',
    descriptionEn: 'Adjacent right in U, white facing right. Separate and insert.',
    executionTipVi: 'Thuật toán 2-gen R-U cơ bản và cực nhanh.', executionTipEn: 'Fast basic 2-gen R-U algorithm.',
    difficulty: 'Beginner', orderIndex: 10
  },
  {
    id: 106, category: 'F2L', subCategory: 'Corner in U & Edge in U', code: 'F2L 11',
    name: 'Trường hợp 11', notation: "U' R U R' U2 R U' R'", alternativeNotation: "R U' R' U2 y' R' U' R",
    setupMoves: "R U R' U2 R U' R' U",
    descriptionVi: 'Góc trắng hướng trước, cạnh nằm phía sau khác màu mặt trên. Ghép cặp bằng U\' R U R\' rồi chèn.',
    descriptionEn: 'White facing front, edge at back with opposite top color.',
    executionTipVi: 'Ghép thành cặp hoàn chỉnh sau 4 bước đầu.', executionTipEn: 'Pairs up cleanly in first 4 moves.',
    difficulty: 'Beginner', orderIndex: 11
  },
  {
    id: 107, category: 'F2L', subCategory: 'Corner in U & Edge in U', code: 'F2L 12',
    name: 'Trường hợp 12', notation: "y' U R' U' R U2 R' U R", alternativeNotation: "U F' U' F U2 F' U F",
    setupMoves: "y' R' U' R U2 R' U R U' y",
    descriptionVi: 'Góc trắng hướng phải, cạnh nằm bên trái khác màu mặt trên. Đối xứng của Trường hợp 11.',
    descriptionEn: 'White facing right, edge at left with opposite top color. Mirror of Case 11.',
    executionTipVi: 'Xoay y\' ngay từ đầu để đưa về thao tác tay phải.', executionTipEn: 'Rotate y\' early for right-hand execution.',
    difficulty: 'Intermediate', orderIndex: 12
  },
  {
    id: 108, category: 'F2L', subCategory: 'Corner in U & Edge in U', code: 'F2L 13',
    name: 'Trường hợp 13', notation: "U' R U2 R' U2 R U' R'", alternativeNotation: "y' U R' U2 R U' R' U R",
    setupMoves: "R U R' U2 R U2 R' U",
    descriptionVi: 'Góc trắng hướng trước, cạnh ở bên trái cùng màu mặt trên. Giấu góc, xoay U2 để ghép rồi chèn.',
    descriptionEn: 'White facing front, edge on left with same top color.',
    executionTipVi: 'Hai lần U2 liên tiếp rất dễ nhớ.', executionTipEn: 'Double U2 rhythm makes it easy to memorize.',
    difficulty: 'Intermediate', orderIndex: 13
  },
  {
    id: 109, category: 'F2L', subCategory: 'Corner in U & Edge in U', code: 'F2L 14',
    name: 'Trường hợp 14', notation: "y' U R' U2 R U2 R' U R", alternativeNotation: "U' R U2 R' U R U R'",
    setupMoves: "y' R' U' R U2 R' U2 R U' y",
    descriptionVi: 'Góc trắng hướng phải, cạnh ở phía sau cùng màu mặt trên. Đối xứng của Trường hợp 13.',
    descriptionEn: 'White facing right, edge at back with same top color. Mirror of Case 13.',
    executionTipVi: 'Có thể dùng công thức thay thế U\' R U2 R\' U R U R\' không cần xoay khối.', executionTipEn: 'Alternative alg avoids cube rotation.',
    difficulty: 'Intermediate', orderIndex: 14
  },
  // Nhóm 3: Góc trắng hướng lên trên & Cạnh ở tầng U (15 - 24)
  {
    id: 110, category: 'F2L', subCategory: 'White Facing Up', code: 'F2L 15',
    name: 'Trường hợp 15', notation: "R U2 R' U' R U R'", alternativeNotation: "(R U2 R') U' (R U R')",
    setupMoves: "R U' R' U R U2 R'",
    descriptionVi: 'Góc trắng hướng lên trên, dính với cạnh bên phải. Dùng R U2 R\' để lật góc và ghép cặp.',
    descriptionEn: 'White facing up, edge attached on right.',
    executionTipVi: 'Một trong những công thức F2L 2-gen mượt nhất.', executionTipEn: 'One of the smoothest 2-gen F2L algs.',
    difficulty: 'Beginner', orderIndex: 15
  },
  {
    id: 111, category: 'F2L', subCategory: 'White Facing Up', code: 'F2L 16',
    name: 'Trường hợp 16', notation: "y' R' U2 R U R' U' R", alternativeNotation: "F' U2 F U F' U' F",
    setupMoves: "y' R' U R U' R' U2 R y",
    descriptionVi: 'Góc trắng hướng lên trên, dính với cạnh phía trước. Đối xứng của Trường hợp 15.',
    descriptionEn: 'White facing up, edge attached in front. Mirror of Case 15.',
    executionTipVi: 'Thực hiện mượt mà sau khi xoay y\'.', executionTipEn: 'Smooth execution after y\' rotation.',
    difficulty: 'Beginner', orderIndex: 16
  },
  {
    id: 112, category: 'F2L', subCategory: 'White Facing Up', code: 'F2L 17',
    name: 'Trường hợp 17', notation: "U R U2 R' U R U' R'", alternativeNotation: "U (R U2 R') U (R U' R')",
    setupMoves: "R U R' U' R U2 R' U'",
    descriptionVi: 'Góc trắng hướng lên trên, cạnh nằm ở mặt sau (màu đỏ hướng lên). Đưa góc qua cạnh rồi chèn.',
    descriptionEn: 'White facing up, edge at back matching front color on top.',
    executionTipVi: ' Ghép cặp trực tiếp bằng R U2 R\'.', executionTipEn: 'Pair directly with R U2 R\'.',
    difficulty: 'Beginner', orderIndex: 17
  },
  {
    id: 113, category: 'F2L', subCategory: 'White Facing Up', code: 'F2L 18',
    name: 'Trường hợp 18', notation: "y' U' R' U2 R U' R' U R", alternativeNotation: "U' F' U2 F U' F' U F",
    setupMoves: "y' R' U' R U R' U2 R U y",
    descriptionVi: 'Góc trắng hướng lên trên, cạnh nằm bên trái (màu xanh hướng lên). Đối xứng của Trường hợp 17.',
    descriptionEn: 'White facing up, edge on left. Mirror of Case 17.',
    executionTipVi: 'Đối xứng hoàn toàn với Trường hợp 17.', executionTipEn: 'Direct mirror of Case 17.',
    difficulty: 'Intermediate', orderIndex: 18
  },
  {
    id: 114, category: 'F2L', subCategory: 'White Facing Up', code: 'F2L 19',
    name: 'Trường hợp 19', notation: "U2 R U R' U R U' R'", alternativeNotation: "U2 (R U R') U (R U' R')",
    setupMoves: "R U R' U' R U' R' U2",
    descriptionVi: 'Góc trắng hướng lên trên, cạnh ở bên phải. Đẩy U2 để đưa cạnh về vị trí ghép với góc.',
    descriptionEn: 'White facing up, edge on right matching front color on top.',
    executionTipVi: 'Toàn bộ chỉ dùng mặt R và U.', executionTipEn: 'Pure R and U moves.',
    difficulty: 'Beginner', orderIndex: 19
  },
  {
    id: 115, category: 'F2L', subCategory: 'White Facing Up', code: 'F2L 20',
    name: 'Trường hợp 20', notation: "y' U2 R' U' R U' R' U R", alternativeNotation: "U2 F' U' F U' F' U F",
    setupMoves: "y' R' U' R U R' U R U2 y",
    descriptionVi: 'Góc trắng hướng lên trên, cạnh ở phía trước. Đối xứng của Trường hợp 19.',
    descriptionEn: 'White facing up, edge in front. Mirror of Case 19.',
    executionTipVi: 'Đối xứng của Trường hợp 19.', executionTipEn: 'Mirror of Case 19.',
    difficulty: 'Intermediate', orderIndex: 20
  },
  {
    id: 116, category: 'F2L', subCategory: 'White Facing Up', code: 'F2L 21',
    name: 'Trường hợp 21', notation: "R U R' U2 R U R' U' R U R'", alternativeNotation: "U2 R2 U2 R' U' R U' R2",
    setupMoves: "R U' R' U R U' R' U2 R U' R'",
    descriptionVi: 'Góc trắng hướng lên, dính sai màu với cạnh phía trước. Tách ra bằng R U R\' U2 rồi ghép lại.',
    descriptionEn: 'White facing up, attached with flipped edge in front.',
    executionTipVi: '3 cụm R U R\' liên hoàn không cần đổi thế tay.', executionTipEn: 'Three fluid R U R\' triggers.',
    difficulty: 'Intermediate', orderIndex: 21
  },
  {
    id: 117, category: 'F2L', subCategory: 'White Facing Up', code: 'F2L 22',
    name: 'Trường hợp 22', notation: "y' R' U' R U2 R' U' R U R' U' R", alternativeNotation: "F U R U' R' F' R U' R'",
    setupMoves: "y' R' U R U' R' U R U2 R' U R y",
    descriptionVi: 'Góc trắng hướng lên, dính sai màu với cạnh bên phải. Đối xứng của Trường hợp 21.',
    descriptionEn: 'White facing up, attached with flipped edge on right.',
    executionTipVi: 'Công thức thay thế F (U R U\' R\') F\' R U\' R\' không cần xoay khối.', executionTipEn: 'Alternative F-trigger avoids rotation.',
    difficulty: 'Intermediate', orderIndex: 22
  },
  {
    id: 118, category: 'F2L', subCategory: 'White Facing Up', code: 'F2L 23',
    name: 'Trường hợp 23', notation: "R U R' U2 R U' R' U R U' R'", alternativeNotation: "U R U' R' U' R U' R' U R U' R'",
    setupMoves: "R U R' U' R U R' U2 R U' R'",
    descriptionVi: 'Góc và cạnh dính nhau nhưng lật ngược màu cạnh (trắng hướng trước). Tách bằng R U R\' U2 rồi chèn.',
    descriptionEn: 'Corner and edge connected incorrectly in U, white facing front.',
    executionTipVi: 'Chuỗi R-U liên hoàn tốc độ cao.', executionTipEn: 'High-speed continuous R-U sequence.',
    difficulty: 'Intermediate', orderIndex: 23
  },
  {
    id: 119, category: 'F2L', subCategory: 'White Facing Up', code: 'F2L 24',
    name: 'Trường hợp 24', notation: "y' R' U' R U2 R' U R U' R' U R", alternativeNotation: "U' R U R2 F R F' R U' R'",
    setupMoves: "y' R' U' R U R' U' R U2 R' U R y",
    descriptionVi: 'Góc và cạnh dính nhau nhưng lật ngược màu cạnh (trắng hướng phải). Đối xứng của Trường hợp 23.',
    descriptionEn: 'Corner and edge connected incorrectly in U, white facing right.',
    executionTipVi: 'Đối xứng hoàn toàn của Trường hợp 23.', executionTipEn: 'Mirror of Case 23.',
    difficulty: 'Intermediate', orderIndex: 24
  },
  // Nhóm 4: Góc ở trong khe & Cạnh ở tầng U (25 - 30)
  {
    id: 120, category: 'F2L', subCategory: 'Corner in Slot & Edge in U', code: 'F2L 25',
    name: 'Trường hợp 25', notation: "U' F' R U R' U' R' F R", alternativeNotation: "U' R' F R F' R U R'",
    setupMoves: "R' F' R U R U' R' F U",
    descriptionVi: 'Góc đã nằm đúng hướng trong khe (trắng ở đáy), cạnh trên tầng U cùng màu mặt trước. Dùng Sledgehammer biến thể.',
    descriptionEn: 'Corner solved in slot, edge in U matching front.',
    executionTipVi: 'Không cần xoay khối, bảo toàn định hướng cạnh tầng U.', executionTipEn: 'Rotationless, preserves U edge orientation.',
    difficulty: 'Intermediate', orderIndex: 25
  },
  {
    id: 121, category: 'F2L', subCategory: 'Corner in Slot & Edge in U', code: 'F2L 26',
    name: 'Trường hợp 26', notation: "U R U' R' U' F' U F", alternativeNotation: "U R U' R' U' y' R' U R",
    setupMoves: "F' U' F U R U R' U'",
    descriptionVi: 'Góc đã nằm đúng hướng trong khe (trắng ở đáy), cạnh trên tầng U cùng màu mặt phải (công thức tầng 2 cơ bản).',
    descriptionEn: 'Corner solved in slot, edge in U matching right.',
    executionTipVi: 'Ghép góc lên cạnh rồi chèn bằng F\' U F.', executionTipEn: 'Pair corner with edge and insert with F\' U F.',
    difficulty: 'Beginner', orderIndex: 26
  },
  {
    id: 122, category: 'F2L', subCategory: 'Corner in Slot & Edge in U', code: 'F2L 27',
    name: 'Trường hợp 27', notation: "R U' R' U R U' R'", alternativeNotation: "(R U' R' U) R U' R'",
    setupMoves: "R U R' U' R U R'",
    descriptionVi: 'Góc nằm trong khe (trắng hướng phải), cạnh trên tầng U cùng màu mặt trên. Đưa góc lên ghép với cạnh rồi chèn.',
    descriptionEn: 'Corner in slot white facing right, edge in U matching top.',
    executionTipVi: 'Chỉ gồm 2 lần trigger R U\' R\' cực nhanh.', executionTipEn: 'Just two fast R U\' R\' triggers.',
    difficulty: 'Beginner', orderIndex: 27
  },
  {
    id: 123, category: 'F2L', subCategory: 'Corner in Slot & Edge in U', code: 'F2L 28',
    name: 'Trường hợp 28', notation: "y' R' U R U' R' U R", alternativeNotation: "R U R' U' F R' F' R",
    setupMoves: "y' R' U' R U R' U' R y",
    descriptionVi: 'Góc nằm trong khe (trắng hướng trước), cạnh trên tầng U. Đối xứng của Trường hợp 27.',
    descriptionEn: 'Corner in slot white facing front, edge in U. Mirror of Case 27.',
    executionTipVi: 'Có thể dùng R U R\' U\' F R\' F\' R không cần xoay khối.', executionTipEn: 'Use R U R\' U\' F R\' F\' R for rotationless solve.',
    difficulty: 'Intermediate', orderIndex: 28
  },
  {
    id: 124, category: 'F2L', subCategory: 'Corner in Slot & Edge in U', code: 'F2L 29',
    name: 'Trường hợp 29', notation: "y' R' U' R U R' U' R", alternativeNotation: "R' F R F' R U' R'",
    setupMoves: "y' R' U R U' R' U R y",
    descriptionVi: 'Góc nằm trong khe (trắng hướng phải), cạnh trên tầng U ngược màu. Xoay y\' hoặc dùng Sledgehammer để ghép.',
    descriptionEn: 'Corner in slot white right, edge flipped in U.',
    executionTipVi: 'R\' F R F\' R U\' R\' giúp giải cực nhanh không cần xoay y\'.', executionTipEn: 'Sledgehammer start avoids rotation.',
    difficulty: 'Intermediate', orderIndex: 29
  },
  {
    id: 125, category: 'F2L', subCategory: 'Corner in Slot & Edge in U', code: 'F2L 30',
    name: 'Trường hợp 30', notation: "R U R' U' R U R'", alternativeNotation: "(R U R' U') (R U R')",
    setupMoves: "R U' R' U R U' R'",
    descriptionVi: 'Góc nằm trong khe (trắng hướng trước), cạnh trên tầng U cùng màu mặt trước. Làm Sexy Move rồi chèn R U R\'.',
    descriptionEn: 'Corner in slot white front, edge in U. Sexy move + insert.',
    executionTipVi: 'Một trong những trường hợp 2-gen tốc độ cao nhất.', executionTipEn: 'One of the fastest 2-gen cases.',
    difficulty: 'Beginner', orderIndex: 30
  },
  // Nhóm 5: Góc ở tầng U & Cạnh ở trong khe (31 - 36)
  {
    id: 126, category: 'F2L', subCategory: 'Corner in U & Edge in Slot', code: 'F2L 31',
    name: 'Trường hợp 31', notation: "R U' R' U y' R' U2 R", alternativeNotation: "U' R' F R F' R U' R'",
    setupMoves: "y' R' U2 R y U' R U R'",
    descriptionVi: 'Góc trắng hướng lên trên ở tầng U, cạnh nằm trong khe nhưng bị lật ngược.',
    descriptionEn: 'Corner in U white facing up, edge flipped in slot.',
    executionTipVi: 'Đưa cạnh lên đồng thời lật góc bằng R U\' R\'.', executionTipEn: 'Extract edge while orienting corner.',
    difficulty: 'Intermediate', orderIndex: 31
  },
  {
    id: 127, category: 'F2L', subCategory: 'Corner in U & Edge in Slot', code: 'F2L 32',
    name: 'Trường hợp 32', notation: "R U R' U' R U R' U' R U R'", alternativeNotation: "(R U R' U')3",
    setupMoves: "R U' R' U R U' R' U R U' R'",
    descriptionVi: 'Góc trắng hướng lên trên ở tầng U, cạnh đã nằm đúng hướng trong khe. Làm 3 lần Sexy Move (hoặc bỏ U\' cuối).',
    descriptionEn: 'Corner in U white facing up, edge oriented in slot. Triple sexy move.',
    executionTipVi: '3 lần Sexy Move liên hoàn cực kỳ dễ nhớ và nhanh.', executionTipEn: 'Triple Sexy Move, effortless fingertrick.',
    difficulty: 'Beginner', orderIndex: 32
  },
  {
    id: 128, category: 'F2L', subCategory: 'Corner in U & Edge in Slot', code: 'F2L 33',
    name: 'Trường hợp 33', notation: "U' R U' R' U2 R U' R'", alternativeNotation: "U' (R U' R') U2 (R U' R')",
    setupMoves: "R U R' U2 R U R' U",
    descriptionVi: 'Góc trắng hướng trước ở tầng U, cạnh đã nằm đúng hướng trong khe. Giấu góc, lấy cạnh lên ghép rồi chèn.',
    descriptionEn: 'Corner in U white front, edge oriented in slot.',
    executionTipVi: 'Thuật toán 2-gen R-U thuần túy.', executionTipEn: 'Pure 2-gen R-U execution.',
    difficulty: 'Intermediate', orderIndex: 33
  },
  {
    id: 129, category: 'F2L', subCategory: 'Corner in U & Edge in Slot', code: 'F2L 34',
    name: 'Trường hợp 34', notation: "y' U R' U R U2 R' U R", alternativeNotation: "U R U R' U2 R U R'",
    setupMoves: "y' R' U' R U2 R' U' R U' y",
    descriptionVi: 'Góc trắng hướng phải ở tầng U, cạnh đã nằm đúng hướng trong khe. Đối xứng của Trường hợp 33.',
    descriptionEn: 'Corner in U white right, edge oriented in slot. Mirror of Case 33.',
    executionTipVi: 'Có thể dùng U R U R\' U2 R U R\' không cần xoay khối.', executionTipEn: 'Use U R U R\' U2 R U R\' to avoid rotation.',
    difficulty: 'Intermediate', orderIndex: 34
  },
  {
    id: 130, category: 'F2L', subCategory: 'Corner in U & Edge in Slot', code: 'F2L 35',
    name: 'Trường hợp 35', notation: "U' R U R' U y' R' U' R", alternativeNotation: "U' R U R' U F' U' F",
    setupMoves: "y' R' U R y U' R U' R' U",
    descriptionVi: 'Góc trắng hướng trước ở tầng U, cạnh nằm trong khe nhưng bị lật ngược. Đưa cạnh lên ghép cặp rồi chèn.',
    descriptionEn: 'Corner in U white front, edge flipped in slot.',
    executionTipVi: 'Kết thúc bằng F\' U\' F giúp không phải xoay khối.', executionTipEn: 'Finish with F\' U\' F for rotationless solve.',
    difficulty: 'Intermediate', orderIndex: 35
  },
  {
    id: 131, category: 'F2L', subCategory: 'Corner in U & Edge in Slot', code: 'F2L 36',
    name: 'Trường hợp 36', notation: "y' U R' U' R U' y R U R'", alternativeNotation: "U F' U' F U' R U R'",
    setupMoves: "R U' R' y' U R' U R U' y",
    descriptionVi: 'Góc trắng hướng phải ở tầng U, cạnh nằm trong khe nhưng bị lật ngược. Đối xứng của Trường hợp 35.',
    descriptionEn: 'Corner in U white right, edge flipped in slot. Mirror of Case 35.',
    executionTipVi: 'Công thức thay thế U F\' U\' F U\' R U R\' cực mượt không cần xoay y.', executionTipEn: 'Alternative U F\' U\' F U\' R U R\' is rotationless.',
    difficulty: 'Intermediate', orderIndex: 36
  },
  // Nhóm 6: Cả góc và cạnh đều ở trong khe (37 - 41)
  {
    id: 132, category: 'F2L', subCategory: 'Both in Slot', code: 'F2L 37',
    name: 'Trường hợp 37', notation: "R U' R' U y' R' U2 R U2 R' U R", alternativeNotation: "R2 U2 F R2 F' U2 R' U R'",
    setupMoves: "y' R' U' R U2 R' U2 R y U' R U R'",
    descriptionVi: 'Góc đã đúng vị trí và đúng hướng trong khe, nhưng cạnh bị lật ngược ngay phía trên.',
    descriptionEn: 'Corner solved in slot, edge flipped in slot.',
    executionTipVi: 'Công thức thay thế R2 U2 F R2 F\' U2 R\' U R\' cực nhanh cho speedcuber nâng cao.', executionTipEn: 'R2 U2 F R2 F\' U2 R\' U R\' is an elite pro algorithm.',
    difficulty: 'Advanced', orderIndex: 37
  },
  {
    id: 133, category: 'F2L', subCategory: 'Both in Slot', code: 'F2L 38',
    name: 'Trường hợp 38', notation: "R U R' U' R U2 R' U' R U R'", alternativeNotation: "R U' R' U' R U R' U2 R U' R'",
    setupMoves: "R U' R' U R U2 R' U R U' R'",
    descriptionVi: 'Cạnh đã đúng hướng trong khe, góc nằm dưới nhưng trắng hướng về phía trước. Lấy lên bằng Sexy Move rồi giải TH15.',
    descriptionEn: 'Edge oriented in slot, corner twisted with white facing front.',
    executionTipVi: 'Tách ra thành Trường hợp 15 rất quen thuộc.', executionTipEn: 'Reduces directly into Case 15.',
    difficulty: 'Advanced', orderIndex: 38
  },
  {
    id: 134, category: 'F2L', subCategory: 'Both in Slot', code: 'F2L 39',
    name: 'Trường hợp 39', notation: "R U' R' U R U2 R' U R U' R'", alternativeNotation: "R U R' U2 R U' R' U R U R'",
    setupMoves: "R U R' U' R U2 R' U' R U R'",
    descriptionVi: 'Cạnh đã đúng hướng trong khe, góc nằm dưới nhưng trắng hướng sang phải. Đưa lên tầng U rồi ghép và chèn.',
    descriptionEn: 'Edge oriented in slot, corner twisted with white facing right.',
    executionTipVi: 'Toàn bộ chỉ dùng mặt R và U rất thuận tay.', executionTipEn: '100% 2-gen R-U moves.',
    difficulty: 'Advanced', orderIndex: 39
  },
  {
    id: 135, category: 'F2L', subCategory: 'Both in Slot', code: 'F2L 40',
    name: 'Trường hợp 40', notation: "R U' R' U' R U' R' U y' R' U' R", alternativeNotation: "r U' r' U2 r U r' R U R'",
    setupMoves: "y' R' U R y U' R U R' U R U R'",
    descriptionVi: 'Cả góc và cạnh đều sai hướng trong khe (trắng hướng trước, cạnh lật). Dùng wide-r hoặc tách ra rồi chèn.',
    descriptionEn: 'Both in slot wrong: white facing front, edge flipped.',
    executionTipVi: 'Công thức thay thế r U\' r\' U2 r U r\' R U R\' cực ngắn và nhanh.', executionTipEn: 'Wide-r alternative is super compact and fast.',
    difficulty: 'Advanced', orderIndex: 40
  },
  {
    id: 136, category: 'F2L', subCategory: 'Both in Slot', code: 'F2L 41',
    name: 'Trường hợp 41', notation: "R U' R' r U' r' U2 r U r'", alternativeNotation: "R U R' U' R U' R' U2 y' R' U' R",
    setupMoves: "r U' r' U2 r U r' R U R'",
    descriptionVi: 'Cả góc và cạnh đều sai hướng trong khe (trắng hướng phải, cạnh lật). Đưa ra rồi dùng trick wide-r.',
    descriptionEn: 'Both in slot wrong: white facing right, edge flipped.',
    executionTipVi: 'Ngược lại hoàn toàn với công thức wide-r của Trường hợp 40.', executionTipEn: 'Exact inverse of Case 40\'s wide-r algorithm.',
    difficulty: 'Advanced', orderIndex: 41
  },

  // ==================== CFOP: OLL (57 trường hợp chuẩn) ====================
  {
    id: 201, category: 'OLL', subCategory: 'Chưa xong cạnh nào', code: 'OLL 01',
    name: 'Trường hợp 1', notation: "R U2 R2 F R F' U2 R' F R F'",
    setupMoves: "F R' F' R U2 F R' F' R2 U2 R'",
    descriptionVi: 'Chưa xong cạnh nào (Dot case): 4 góc vàng hướng sang hai bên.',
    descriptionEn: 'Dot case: no edges oriented, side headlights.',
    executionTipVi: 'Kết hợp Sledgehammer ở cuối để lật toàn bộ mặt vàng.', executionTipEn: 'Finish with crisp Sledgehammer.',
    difficulty: 'Advanced', orderIndex: 1
  },
  {
    id: 202, category: 'OLL', subCategory: 'Chưa xong cạnh nào', code: 'OLL 02',
    name: 'Trường hợp 2', notation: "r U r' U2 r U2 R' U2 R U' r'",
    alternativeNotation: "F R U R' U' F' f R U R' U' f'",
    setupMoves: "r U R' U2 R U2 r' U2 r U' r'",
    descriptionVi: 'Chưa xong cạnh nào: 2 góc vàng cùng phía bên trái, 2 góc còn lại tách ra.',
    descriptionEn: 'Dot case: headlights on left, split corners on right.',
    executionTipVi: 'Có thể dùng F (R U R\' U\') F\' f (R U R\' U\') f\' cực kỳ dễ nhớ.', executionTipEn: 'Can also use F-sexy-F\' + f-sexy-f\'.',
    difficulty: 'Intermediate', orderIndex: 2
  },
  {
    id: 203, category: 'OLL', subCategory: 'Chưa xong cạnh nào', code: 'OLL 03',
    name: 'Trường hợp 3', notation: "f R U R' U' f' U' F R U R' U' F'",
    setupMoves: "F U R U' R' F' U f U R U' R' f'",
    descriptionVi: 'Chưa xong cạnh nào: 1 góc vàng đã lật lên ở góc trước-phải.',
    descriptionEn: 'Dot case with 1 corner oriented at front-right.',
    executionTipVi: 'f-Sexy-f\' kết hợp U\' và F-Sexy-F\'.', executionTipEn: 'f-Sexy-f\' followed by U\' and F-Sexy-F\'.',
    difficulty: 'Intermediate', orderIndex: 3
  },
  {
    id: 204, category: 'OLL', subCategory: 'Chưa xong cạnh nào', code: 'OLL 04',
    name: 'Trường hợp 4', notation: "f R U R' U' f' U F R U R' U' F'",
    setupMoves: "F U R U' R' F' U' f U R U' R' f'",
    descriptionVi: 'Chưa xong cạnh nào: 1 góc vàng đã lật lên ở góc sau-phải (đối xứng OLL 3).',
    descriptionEn: 'Dot case with 1 corner oriented at back-right.',
    executionTipVi: 'Giống hệt OLL 3 nhưng thay U\' ở giữa bằng U.', executionTipEn: 'Same as OLL 3 with U instead of U\'.',
    difficulty: 'Intermediate', orderIndex: 4
  },
  {
    id: 205, category: 'OLL', subCategory: 'Hình vuông', code: 'OLL 05',
    name: 'Trường hợp 5', notation: "l' U2 L U L' U l",
    alternativeNotation: "r' U2 R U R' U r",
    setupMoves: "l' U' L U' L' U2 l",
    descriptionVi: 'Hình vuông góc phải-trước: Wide Anti-Sune bên trái.',
    descriptionEn: 'Square shape: Left wide Anti-Sune.',
    executionTipVi: 'Công thức 7 bước cực ngắn và nhanh.', executionTipEn: 'Very fast 7-move wide trigger.',
    difficulty: 'Beginner', orderIndex: 5, isFavorite: true
  },
  {
    id: 206, category: 'OLL', subCategory: 'Hình vuông', code: 'OLL 06',
    name: 'Trường hợp 6', notation: "r U2 R' U' R U' r'",
    setupMoves: "r U R' U R U2 r'",
    descriptionVi: 'Hình vuông góc trên-giữa: Wide Anti-Sune bên phải (đối xứng OLL 5).',
    descriptionEn: 'Square shape: Right wide Anti-Sune.',
    executionTipVi: 'Dùng wide-r thực hiện giống hệt Anti-Sune.', executionTipEn: 'Execute just like Anti-Sune with wide r.',
    difficulty: 'Beginner', orderIndex: 6, isFavorite: true
  },
  {
    id: 207, category: 'OLL', subCategory: 'Tia sét', code: 'OLL 07',
    name: 'Trường hợp 7', notation: "r U R' U R U2 r'",
    setupMoves: "r U2 R' U' R U' r'",
    descriptionVi: 'Tia sét nhỏ bên trái: Wide Sune tay phải.',
    descriptionEn: 'Small lightning bolt: Right wide Sune.',
    executionTipVi: 'Giống hệt công thức Sune cơ bản nhưng mở đầu và kết thúc bằng r.', executionTipEn: 'Standard Sune using wide r.',
    difficulty: 'Beginner', orderIndex: 7, isFavorite: true
  },
  {
    id: 208, category: 'OLL', subCategory: 'Tia sét', code: 'OLL 08',
    name: 'Trường hợp 8', notation: "l' U' L U' L' U2 l",
    alternativeNotation: "r' U' R U' R' U2 r",
    setupMoves: "l' U2 L U L' U l",
    descriptionVi: 'Tia sét nhỏ bên phải: Đối xứng của OLL 7.',
    descriptionEn: 'Small lightning bolt: Mirror of OLL 7.',
    executionTipVi: 'Wide Sune tay trái cực mượt.', executionTipEn: 'Smooth left-hand wide Sune.',
    difficulty: 'Beginner', orderIndex: 8
  },
  {
    id: 209, category: 'OLL', subCategory: 'Hình cá', code: 'OLL 09',
    name: 'Trường hợp 9', notation: "R U R' U' R' F R2 U R' U' F'",
    setupMoves: "F U R U' R2 F' R U R U' R'",
    descriptionVi: 'Hình cá nhỏ nhìn sang phải-dưới.',
    descriptionEn: 'Kite/Fish shape with 1 corner and 2 edges oriented.',
    executionTipVi: 'Bắt đầu như T-Perm rất thuận tay.', executionTipEn: 'Starts with familiar T-Perm fingertricks.',
    difficulty: 'Intermediate', orderIndex: 9
  },
  {
    id: 210, category: 'OLL', subCategory: 'Hình cá', code: 'OLL 10',
    name: 'Trường hợp 10', notation: "R U R' U R' F R F' R U2 R'",
    setupMoves: "R U2 R' F R' F' R U' R U' R'",
    descriptionVi: 'Hình cá nhỏ nhìn sang trái-trên (đối xứng OLL 9).',
    descriptionEn: 'Fish shape: Mirror of OLL 9.',
    executionTipVi: 'Chèn Sledgehammer vào giữa công thức Sune.', executionTipEn: 'Sune with an inserted Sledgehammer.',
    difficulty: 'Intermediate', orderIndex: 10
  },
  {
    id: 211, category: 'OLL', subCategory: 'Tia sét', code: 'OLL 11',
    name: 'Trường hợp 11', notation: "r U R' U R' F R F' R U2 r'",
    setupMoves: "r U2 R' F R' F' R U' R U' r'",
    descriptionVi: 'Tia sét ngược: Giống OLL 10 nhưng dùng wide-r ở đầu và cuối.',
    descriptionEn: 'Lightning bolt: Wide version of OLL 10.',
    executionTipVi: 'Giống hệt OLL 10, chỉ thay R đầu và R\' cuối thành r và r\'.', executionTipEn: 'Identical to OLL 10 with wide r start/end.',
    difficulty: 'Intermediate', orderIndex: 11
  },
  {
    id: 212, category: 'OLL', subCategory: 'Tia sét', code: 'OLL 12',
    name: 'Trường hợp 12', notation: "M' R' U' R U' R' U2 R U' M",
    alternativeNotation: "F R U R' U' F' U F R U R' U' F'",
    setupMoves: "M' U R' U2 R U R' U R M",
    descriptionVi: 'Tia sét đối xứng của OLL 11.',
    descriptionEn: 'Lightning bolt: Mirror of OLL 11.',
    executionTipVi: 'Có thể làm 2 lần F (R U R\' U\') F\' cách nhau bởi bước U.', executionTipEn: 'Can also be solved with F-sexy-F\' U F-sexy-F\'.',
    difficulty: 'Intermediate', orderIndex: 12
  },
  {
    id: 213, category: 'OLL', subCategory: 'Hình chữ L nhỏ', code: 'OLL 13',
    name: 'Trường hợp 13', notation: "F U R U' R2 F' R U R U' R'",
    setupMoves: "R U R' U' R' F R2 U R' U' F'",
    descriptionVi: 'Hình súng / chữ L ngang có 1 góc vàng.',
    descriptionEn: 'Knight move shape (gun shape) left.',
    executionTipVi: 'Nghịch đảo chính xác của OLL 9.', executionTipEn: 'Exact inverse of OLL 9.',
    difficulty: 'Intermediate', orderIndex: 13
  },
  {
    id: 214, category: 'OLL', subCategory: 'Hình chữ L nhỏ', code: 'OLL 14',
    name: 'Trường hợp 14', notation: "R' F R U R' F' R F U' F'",
    setupMoves: "F U F' R' F R U' R' F' R",
    descriptionVi: 'Hình súng / chữ L ngang đối xứng với OLL 13.',
    descriptionEn: 'Knight move shape right (mirror of OLL 13).',
    executionTipVi: 'Sledgehammer biến thể không cần đổi tay cầm.', executionTipEn: 'Regripless modified sledgehammer.',
    difficulty: 'Intermediate', orderIndex: 14
  },
  {
    id: 215, category: 'OLL', subCategory: 'Hình chữ L nhỏ', code: 'OLL 15',
    name: 'Trường hợp 15', notation: "l' U' l L' U' L U l' U l",
    alternativeNotation: "r' U' r R' U' R U r' U r",
    setupMoves: "l' U' l' U' L' U L l' U l",
    descriptionVi: 'Hình chữ L ngang kèm góc bên trái.',
    descriptionEn: 'Knight move shape with left wide triggers.',
    executionTipVi: 'Dùng r\' U\' r kết hợp Sexy Move ngược.', executionTipEn: 'Smooth wide r\' triggers.',
    difficulty: 'Intermediate', orderIndex: 15
  },
  {
    id: 216, category: 'OLL', subCategory: 'Hình chữ L nhỏ', code: 'OLL 16',
    name: 'Trường hợp 16', notation: "r U r' R U R' U' r U' r'",
    setupMoves: "r U r' U R U' R' r U' r'",
    descriptionVi: 'Hình chữ L ngang kèm góc bên phải (đối xứng OLL 15).',
    descriptionEn: 'Knight move shape right (mirror of OLL 15).',
    executionTipVi: 'r U r\' + Sexy Move + r U\' r\' cực dễ thuộc.', executionTipEn: 'r U r\' + Sexy Move + r U\' r\'.',
    difficulty: 'Beginner', orderIndex: 16
  },
  {
    id: 217, category: 'OLL', subCategory: 'Chưa xong cạnh nào', code: 'OLL 17',
    name: 'Trường hợp 17', notation: "F R' F' R2 r' U R U' R' U' M'",
    setupMoves: "M U R U R' U' r R2 F R F'",
    descriptionVi: 'Chưa xong cạnh nào: Đường chéo 2 góc vàng đã lật.',
    descriptionEn: 'Dot case with 2 diagonal corners oriented (Slash).',
    executionTipVi: 'Mở đầu bằng Sledgehammer rồi nối sang wide-r.', executionTipEn: 'Sledgehammer into wide-r finish.',
    difficulty: 'Advanced', orderIndex: 17
  },
  {
    id: 218, category: 'OLL', subCategory: 'Chưa xong cạnh nào', code: 'OLL 18',
    name: 'Trường hợp 18', notation: "r U R' U R U2 r2 U' R U' R' U2 r",
    setupMoves: "r' U2 R U R' U r2 U2 R' U' R U' r'",
    descriptionVi: 'Chưa xong cạnh nào: Vương miện (2 góc vàng liền kề phía sau).',
    descriptionEn: 'Dot case: Crown shape (2 adjacent corners oriented).',
    executionTipVi: 'Kết hợp Wide Sune (OLL 7) và Wide Anti-Sune (OLL 6).', executionTipEn: 'Seamless combo of OLL 7 and OLL 6.',
    difficulty: 'Intermediate', orderIndex: 18
  },
  {
    id: 219, category: 'OLL', subCategory: 'Chưa xong cạnh nào', code: 'OLL 19',
    name: 'Trường hợp 19', notation: "r' R U R U R' U' M' R' F R F'",
    setupMoves: "F R' F' R M U R U' R' U' R' r",
    descriptionVi: 'Chưa xong cạnh nào: Tai thỏ (2 góc vàng liền kề + thanh 3 vàng mặt sau).',
    descriptionEn: 'Dot case: Bunny shape.',
    executionTipVi: 'M U (R U R\' U\') M\' kết hợp Sledgehammer.', executionTipEn: 'M-slice sexy move into Sledgehammer.',
    difficulty: 'Intermediate', orderIndex: 19
  },
  {
    id: 220, category: 'OLL', subCategory: 'Chưa xong cạnh nào', code: 'OLL 20',
    name: 'Trường hợp 20', notation: "r U R' U' M2 U R U' R' U' M'",
    setupMoves: "M U R U R' U' M2 U R U' r'",
    descriptionVi: 'Chưa xong cạnh nào: Hình chữ X (4 góc vàng đã đúng hướng, 4 cạnh bị lật).',
    descriptionEn: 'X-shape dot case: All 4 corners oriented, 0 edges oriented.',
    executionTipVi: 'Thuật toán đối xứng siêu đẹp mắt dùng tầng M.', executionTipEn: 'Fast M-slice 4-edge flip.',
    difficulty: 'Intermediate', orderIndex: 20
  },
  {
    id: 15, category: 'OLL', subCategory: 'Dấu cộng', code: 'OLL 21',
    name: 'Trường hợp 21', notation: "R U2 R' U' R U R' U' R U' R'",
    alternativeNotation: "F (R U R' U')3 F'",
    setupMoves: "R U R' U R U' R' U R U2 R'",
    descriptionVi: 'Dấu cộng (H-Shape): 4 cạnh đã đúng, 2 cặp góc headlights đối diện nhau.',
    descriptionEn: 'Cross H-Shape: Double headlights.',
    executionTipVi: 'Double Anti-Sune không cần đổi tay cầm.', executionTipEn: 'Regripless double Sune/Anti-Sune.',
    difficulty: 'Beginner', orderIndex: 21, userStatus: 'Practicing', isFavorite: true
  },
  {
    id: 222, category: 'OLL', subCategory: 'Dấu cộng', code: 'OLL 22',
    name: 'Trường hợp 22', notation: "R U2 R2 U' R2 U' R2 U2 R",
    setupMoves: "R' U2 R2 U R2 U R2 U2 R'",
    descriptionVi: 'Dấu cộng (Pi / Bruno): 1 cặp headlights bên trái, 2 góc bên phải quay ra hai phía.',
    descriptionEn: 'Cross Pi-Shape (Bruno): Headlights on left, split on right.',
    executionTipVi: 'Toàn bộ chỉ dùng mặt R và U2 cực kỳ nhanh.', executionTipEn: 'Pure 2-gen R2/U2 speed algorithm.',
    difficulty: 'Beginner', orderIndex: 22, isFavorite: true
  },
  {
    id: 223, category: 'OLL', subCategory: 'Dấu cộng', code: 'OLL 23',
    name: 'Trường hợp 23', notation: "R2 D' R U2 R' D R U2 R",
    setupMoves: "R' U2 R' D' R U2 R' D R2",
    descriptionVi: 'Dấu cộng (Headlights / Superman): 2 góc sau đã lật, 2 góc trước hướng về phía trước.',
    descriptionEn: 'Cross Headlights (U-OCLL).',
    executionTipVi: 'Dùng ngón áp út trái gảy D\' và D.', executionTipEn: 'Left ring finger push/pull for D\' and D.',
    difficulty: 'Beginner', orderIndex: 23, isFavorite: true
  },
  {
    id: 224, category: 'OLL', subCategory: 'Dấu cộng', code: 'OLL 24',
    name: 'Trường hợp 24', notation: "r U R' U' r' F R F'",
    setupMoves: "F R' F' r U R U' r'",
    descriptionVi: 'Dấu cộng (T-OCLL / Chameleon): 2 góc bên phải đã lật, 2 góc bên trái quay ra trước và sau.',
    descriptionEn: 'Cross Chameleon (T-OCLL).',
    executionTipVi: '8 bước siêu tốc độ, dùng chung với COLL.', executionTipEn: 'Ultra-fast 8-move wide trigger.',
    difficulty: 'Beginner', orderIndex: 24, isFavorite: true
  },
  {
    id: 225, category: 'OLL', subCategory: 'Dấu cộng', code: 'OLL 25',
    name: 'Trường hợp 25', notation: "F' r U R' U' r' F R",
    setupMoves: "R' F' r U R U' r' F",
    descriptionVi: 'Dấu cộng (Bowtie / L-OCLL): 2 góc chéo nhau đã lật đúng.',
    descriptionEn: 'Cross Bowtie (L-OCLL): 2 diagonal corners oriented.',
    executionTipVi: 'Đưa bước F\' của OLL 24 lên đầu công thức.', executionTipEn: 'Cyclic shift of OLL 24.',
    difficulty: 'Beginner', orderIndex: 25, isFavorite: true
  },
  {
    id: 226, category: 'OLL', subCategory: 'Dấu cộng', code: 'OLL 26',
    name: 'Trường hợp 26', notation: "R U2 R' U' R U' R'",
    setupMoves: "R U R' U R U2 R'",
    descriptionVi: 'Dấu cộng (Anti-Sune): 1 góc vàng đã lật ở góc sau-phải.',
    descriptionEn: 'Anti-Sune: 1 corner oriented.',
    executionTipVi: '1 trong 2 công thức cốt lõi nhất của 2-Look OLL.', executionTipEn: 'Core 2-Look OLL algorithm.',
    difficulty: 'Beginner', orderIndex: 26, userStatus: 'Mastered', isFavorite: true
  },
  {
    id: 227, category: 'OLL', subCategory: 'Dấu cộng', code: 'OLL 27',
    name: 'Trường hợp 27', notation: "R U R' U R U2 R'",
    setupMoves: "R U2 R' U' R U' R'",
    descriptionVi: 'Dấu cộng (Sune): 1 góc vàng đã lật ở góc trước-trái.',
    descriptionEn: 'Sune: The most famous OLL algorithm.',
    executionTipVi: 'Công thức OLL cơ bản và nhanh nhất mọi thời đại.', executionTipEn: 'The most essential OLL algorithm.',
    difficulty: 'Beginner', orderIndex: 27, userStatus: 'Mastered', isFavorite: true
  },
  {
    id: 228, category: 'OLL', subCategory: 'Đúng hết góc', code: 'OLL 28',
    name: 'Trường hợp 28', notation: "r U R' U' r' R U R U' R'",
    setupMoves: "R U R' U' R' r U R U' r'",
    descriptionVi: 'Đúng hết 4 góc (Mũi tên): 2 cạnh liền kề bị lật.',
    descriptionEn: 'Stealth / Arrow shape: All corners oriented, 2 adjacent edges flipped.',
    executionTipVi: 'Lật 2 cạnh liền kề cực mượt không làm xáo trộn góc.', executionTipEn: 'Flips 2 adjacent edges cleanly.',
    difficulty: 'Beginner', orderIndex: 28
  },
  {
    id: 229, category: 'OLL', subCategory: 'Hình vụng về', code: 'OLL 29',
    name: 'Trường hợp 29', notation: "R U R' U' R U' R' F' U' F R U R'",
    setupMoves: "R U' R' F' U F R U R' U R U' R'",
    descriptionVi: 'Hình vụng về (Awkward shape 1).',
    descriptionEn: 'Awkward shape 1.',
    executionTipVi: 'Kết hợp Sexy Move với chèn F\' U\' F.', executionTipEn: 'Smooth R-U into F\' U\' F trigger.',
    difficulty: 'Advanced', orderIndex: 29
  },
  {
    id: 230, category: 'OLL', subCategory: 'Hình vụng về', code: 'OLL 30',
    name: 'Trường hợp 30', notation: "F R' F R2 U' R' U' R U R' F2",
    setupMoves: "F2 R U' R' U R U R2 F' R F'",
    descriptionVi: 'Hình vụng về (Awkward shape 2 - đối xứng OLL 29).',
    descriptionEn: 'Awkward shape 2 (mirror of OLL 29).',
    executionTipVi: 'Kết thúc bằng F2 tốc độ cao.', executionTipEn: 'Fast double-flick F2 finish.',
    difficulty: 'Advanced', orderIndex: 30
  },
  {
    id: 231, category: 'OLL', subCategory: 'Hình chữ P', code: 'OLL 31',
    name: 'Trường hợp 31', notation: "R' U' F U R U' R' F' R",
    setupMoves: "R' F R U R' U' F' U R",
    descriptionVi: 'Hình chữ P bên phải, thanh cạnh vàng ở bên phải.',
    descriptionEn: 'P-Shape right.',
    executionTipVi: 'Ngắn gọn chỉ 9 bước xoay.', executionTipEn: 'Compact 9-move trigger.',
    difficulty: 'Intermediate', orderIndex: 31
  },
  {
    id: 232, category: 'OLL', subCategory: 'Hình chữ P', code: 'OLL 32',
    name: 'Trường hợp 32', notation: "L U F' U' L' U L F L'",
    alternativeNotation: "S R U R' U' R' F R f'",
    setupMoves: "L F' L' U' L U F U' L'",
    descriptionVi: 'Hình chữ P bên trái (đối xứng OLL 31).',
    descriptionEn: 'P-Shape left (mirror of OLL 31).',
    executionTipVi: 'Đối xứng tay trái của OLL 31.', executionTipEn: 'Left-hand mirror of OLL 31.',
    difficulty: 'Intermediate', orderIndex: 32
  },
  {
    id: 13, category: 'OLL', subCategory: 'Hình chữ T', code: 'OLL 33',
    name: 'Trường hợp 33', notation: "R U R' U' R' F R F'",
    setupMoves: "F R' F' R U R U' R'",
    descriptionVi: 'Hình chữ T kinh điển: Sexy Move + Sledgehammer.',
    descriptionEn: 'Classic T-Shape: Sexy Move + Sledgehammer.',
    executionTipVi: 'Không cần đổi tay cầm, mượt nhất trong 57 OLL.', executionTipEn: '100% regripless and ultra-fast.',
    difficulty: 'Beginner', orderIndex: 33, userStatus: 'Mastered', isFavorite: true
  },
  {
    id: 234, category: 'OLL', subCategory: 'Hình chữ C', code: 'OLL 34',
    name: 'Trường hợp 34', notation: "R U R2 U' R' F R U R U' F'",
    setupMoves: "F U R' U' R' F' R U R2 U' R'",
    descriptionVi: 'Hình chữ C nằm ngang với thanh 3 cạnh ở giữa.',
    descriptionEn: 'C-Shape horizontal.',
    executionTipVi: 'Chuyển từ R2 U\' R\' sang F rất tự nhiên.', executionTipEn: 'Smooth R2 U\' R\' into F.',
    difficulty: 'Intermediate', orderIndex: 34
  },
  {
    id: 235, category: 'OLL', subCategory: 'Hình cá', code: 'OLL 35',
    name: 'Trường hợp 35', notation: "R U2 R2 F R F' R U2 R'",
    setupMoves: "R U2 R' F R' F' R2 U2 R'",
    descriptionVi: 'Hình cá đường chéo (Fish Salad): Sledgehammer kẹp giữa R U2 R2 và R U2 R\'.',
    descriptionEn: 'Fish Salad: Diagonal fish shape.',
    executionTipVi: 'Công thức đối xứng ở đầu và cuối rất dễ nhớ.', executionTipEn: 'Symmetric start and end around Sledgehammer.',
    difficulty: 'Intermediate', orderIndex: 35
  },
  {
    id: 236, category: 'OLL', subCategory: 'Hình chữ W', code: 'OLL 36',
    name: 'Trường hợp 36', notation: "L' U' L U' L' U L U L F' L' F",
    alternativeNotation: "R' U' R U' R' U R U l U' R' U x",
    setupMoves: "F' L F L' U' L' U' L U L' U L",
    descriptionVi: 'Hình chữ W bên trái.',
    descriptionEn: 'W-Shape left.',
    executionTipVi: 'Đối xứng hoàn toàn với OLL 38.', executionTipEn: 'Direct mirror of OLL 38.',
    difficulty: 'Intermediate', orderIndex: 36
  },
  {
    id: 237, category: 'OLL', subCategory: 'Hình cá', code: 'OLL 37',
    name: 'Trường hợp 37', notation: "F R' F' R U R U' R'",
    setupMoves: "R U R' U' R' F R F'",
    descriptionVi: 'Hình cá mặt trước (Mounted Fish): Sledgehammer + Sexy Move ngược.',
    descriptionEn: 'Mounted Fish: Inverse of OLL 33.',
    executionTipVi: 'Nghịch đảo chính xác của OLL 33 (chữ T), chỉ 8 bước.', executionTipEn: 'Exact inverse of OLL 33 (T-Shape).',
    difficulty: 'Beginner', orderIndex: 37, isFavorite: true
  },
  {
    id: 238, category: 'OLL', subCategory: 'Hình chữ W', code: 'OLL 38',
    name: 'Trường hợp 38', notation: "R U R' U R U' R' U' R' F R F'",
    setupMoves: "F R' F' R U R U R' U' R U' R'",
    descriptionVi: 'Hình chữ W bên phải.',
    descriptionEn: 'W-Shape right.',
    executionTipVi: 'Nửa đầu giống Sune, kết thúc bằng Sledgehammer.', executionTipEn: 'Sune start into Sledgehammer finish.',
    difficulty: 'Beginner', orderIndex: 38
  },
  {
    id: 239, category: 'OLL', subCategory: 'Tia sét lớn', code: 'OLL 39',
    name: 'Trường hợp 39', notation: "L F' L' U' L U F U' L'",
    setupMoves: "L U F' U' L' U L F L'",
    descriptionVi: 'Tia sét lớn bên trái (Fung).',
    descriptionEn: 'Big Lightning Bolt left.',
    executionTipVi: 'Nghịch đảo của OLL 32.', executionTipEn: 'Exact inverse of OLL 32.',
    difficulty: 'Intermediate', orderIndex: 39
  },
  {
    id: 240, category: 'OLL', subCategory: 'Tia sét lớn', code: 'OLL 40',
    name: 'Trường hợp 40', notation: "R' F R U R' U' F' U R",
    setupMoves: "R' U' F U R U' R' F' R",
    descriptionVi: 'Tia sét lớn bên phải (đối xứng OLL 39).',
    descriptionEn: 'Big Lightning Bolt right.',
    executionTipVi: 'Nghịch đảo chính xác của OLL 31.', executionTipEn: 'Exact inverse of OLL 31.',
    difficulty: 'Intermediate', orderIndex: 40
  },
  {
    id: 241, category: 'OLL', subCategory: 'Hình vụng về', code: 'OLL 41',
    name: 'Trường hợp 41', notation: "R U R' U R U2 R' F R U R' U' F'",
    setupMoves: "F U R U' R' F' R U2 R' U' R U' R'",
    descriptionVi: 'Hình vụng về 3: Sune kết hợp F (R U R\' U\') F\'.',
    descriptionEn: 'Awkward shape 3: Sune + OLL 45.',
    executionTipVi: 'Làm Sune (OLL 27) nối liền vào OLL 45.', executionTipEn: 'Just Sune followed directly by OLL 45.',
    difficulty: 'Beginner', orderIndex: 41
  },
  {
    id: 242, category: 'OLL', subCategory: 'Hình vụng về', code: 'OLL 42',
    name: 'Trường hợp 42', notation: "R' U' R U' R' U2 R F R U R' U' F'",
    setupMoves: "F U R U' R' F' R' U2 R U R' U R",
    descriptionVi: 'Hình vụng về 4 (đối xứng OLL 41): Sune mặt sau + OLL 45.',
    descriptionEn: 'Awkward shape 4: Back Sune + OLL 45.',
    executionTipVi: 'R\' U\' R U\' R\' U2 R nối liền vào F (R U R\' U\') F\'.', executionTipEn: 'Back-Sune directly into OLL 45.',
    difficulty: 'Beginner', orderIndex: 42
  },
  {
    id: 243, category: 'OLL', subCategory: 'Hình chữ P', code: 'OLL 43',
    name: 'Trường hợp 43', notation: "F' U' L' U L F",
    alternativeNotation: "f' L' U' L U f",
    setupMoves: "F' L' U' L U F",
    descriptionVi: 'Hình chữ P cơ bản bên phải (6 bước).',
    descriptionEn: 'Basic 6-move P-Shape.',
    executionTipVi: 'Một trong những OLL ngắn nhất (6 bước).', executionTipEn: 'One of the shortest 6-move OLLs.',
    difficulty: 'Beginner', orderIndex: 43
  },
  {
    id: 244, category: 'OLL', subCategory: 'Hình chữ P', code: 'OLL 44',
    name: 'Trường hợp 44', notation: "F U R U' R' F'",
    alternativeNotation: "f R U R' U' f'",
    setupMoves: "F R U R' U' F'",
    descriptionVi: 'Hình chữ P cơ bản bên trái (6 bước - nghịch đảo OLL 45).',
    descriptionEn: 'Basic 6-move P-Shape left (inverse of OLL 45).',
    executionTipVi: 'Có thể đặt chữ P bên phải và làm f (R U R\' U\') f\'.', executionTipEn: 'Fast 6-move F-trigger.',
    difficulty: 'Beginner', orderIndex: 44, isFavorite: true
  },
  {
    id: 14, category: 'OLL', subCategory: 'Hình chữ T', code: 'OLL 45',
    name: 'Trường hợp 45', notation: "F R U R' U' F'",
    setupMoves: "F U R U' R' F'",
    descriptionVi: 'Hình chữ T cơ bản: F + Sexy Move + F\' chỉ với 6 bước.',
    descriptionEn: 'Front T-Shape: 6-move F-Sexy-F\'.',
    executionTipVi: 'Công thức 6 bước kinh điển, hoàn thành dưới 0.6 giây.', executionTipEn: 'Classic 6-move trigger, easily sub-0.6s.',
    difficulty: 'Beginner', orderIndex: 45, userStatus: 'Mastered', isFavorite: true
  },
  {
    id: 246, category: 'OLL', subCategory: 'Hình chữ C', code: 'OLL 46',
    name: 'Trường hợp 46', notation: "R' U' R' F R F' U R",
    setupMoves: "R' U' F R' F' R U R",
    descriptionVi: 'Hình chữ C dọc với thanh 3 vàng bên trái.',
    descriptionEn: 'Vertical C-Shape with 3-bar on left.',
    executionTipVi: 'Sledgehammer kẹp giữa R\' U\' và U R cực nhanh.', executionTipEn: 'Sledgehammer sandwiched between R\' U\' and U R.',
    difficulty: 'Beginner', orderIndex: 46
  },
  {
    id: 247, category: 'OLL', subCategory: 'Hình chữ L nhỏ', code: 'OLL 47',
    name: 'Trường hợp 47', notation: "R' U' R' F R F' R' F R F' U R",
    alternativeNotation: "F' L' U' L U L' U' L U F",
    setupMoves: "R' U' F R' F' R F R' F' R U R",
    descriptionVi: 'Hình góc chữ L nhỏ (đối xứng OLL 48).',
    descriptionEn: 'Small L-Shape (mirror of OLL 48).',
    executionTipVi: 'Giống OLL 46 nhưng lặp lại Sledgehammer 2 lần.', executionTipEn: 'Same as OLL 46 with double Sledgehammer.',
    difficulty: 'Intermediate', orderIndex: 47
  },
  {
    id: 248, category: 'OLL', subCategory: 'Hình chữ L nhỏ', code: 'OLL 48',
    name: 'Trường hợp 48', notation: "F R U R' U' R U R' U' F'",
    setupMoves: "F U R U' R' U R U' R' F'",
    descriptionVi: 'Hình góc chữ L nhỏ: F + 2 lần Sexy Move + F\'.',
    descriptionEn: 'Small L-Shape: F + double Sexy Move + F\'.',
    executionTipVi: 'Giống OLL 45 nhưng làm Sexy Move 2 lần liên tiếp.', executionTipEn: 'Like OLL 45 with double Sexy Move.',
    difficulty: 'Beginner', orderIndex: 48, isFavorite: true
  },
  {
    id: 249, category: 'OLL', subCategory: 'Hình chữ L nhỏ', code: 'OLL 49',
    name: 'Trường hợp 49', notation: "r U' r2 U r2 U r2 U' r",
    setupMoves: "r' U r2 U' r2 U' r2 U r'",
    descriptionVi: 'Hình góc chữ L nhỏ kèm thanh 3 vàng bên phải.',
    descriptionEn: 'Small L-Shape with right 3-bar.',
    executionTipVi: 'Chỉ dùng wide-r và U cực kỳ nhịp nhàng.', executionTipEn: 'Rhythmic wide-r2 trigger.',
    difficulty: 'Intermediate', orderIndex: 49
  },
  {
    id: 250, category: 'OLL', subCategory: 'Hình chữ L nhỏ', code: 'OLL 50',
    name: 'Trường hợp 50', notation: "r' U r2 U' r2 U' r2 U r'",
    setupMoves: "r U' r2 U r2 U r2 U' r",
    descriptionVi: 'Hình góc chữ L nhỏ kèm thanh 3 vàng bên trái (nghịch đảo OLL 49).',
    descriptionEn: 'Small L-Shape (inverse of OLL 49).',
    executionTipVi: 'Nghịch đảo chính xác của OLL 49.', executionTipEn: 'Exact inverse of OLL 49.',
    difficulty: 'Intermediate', orderIndex: 50
  },
  {
    id: 251, category: 'OLL', subCategory: 'Hình chữ I', code: 'OLL 51',
    name: 'Trường hợp 51', notation: "F U R U' R' U R U' R' F'",
    alternativeNotation: "f R U R' U' R U R' U' f'",
    setupMoves: "F R U R' U' R U R' U' F'",
    descriptionVi: 'Hình thanh ngang chữ I: F + 2 lần Inverse Sexy + F\'.',
    descriptionEn: 'Horizontal I-Shape (Bottlecap).',
    executionTipVi: 'Giống OLL 44 nhưng lặp lại U R U\' R\' 2 lần.', executionTipEn: 'Like OLL 44 with double U R U\' R\'.',
    difficulty: 'Beginner', orderIndex: 51
  },
  {
    id: 252, category: 'OLL', subCategory: 'Hình chữ I', code: 'OLL 52',
    name: 'Trường hợp 52', notation: "R U R' U R U' B U' B' R'",
    alternativeNotation: "R' U' R U' R' U y' R' U R B",
    setupMoves: "R B U B' U R' U' R U' R'",
    descriptionVi: 'Hình thanh dọc chữ I với thanh 3 vàng bên phải.',
    descriptionEn: 'Vertical I-Shape with right 3-bar.',
    executionTipVi: 'Mở đầu giống Sune rồi chuyển sang B U\' B\' R\'.', executionTipEn: 'Sune start into B U\' B\' R\'.',
    difficulty: 'Intermediate', orderIndex: 52
  },
  {
    id: 253, category: 'OLL', subCategory: 'Hình chữ L nhỏ', code: 'OLL 53',
    name: 'Trường hợp 53', notation: "l' U2 L U L' U' L U L' U l",
    alternativeNotation: "r' U2 R U R' U' R U R' U r",
    setupMoves: "l' U' L U' L' U L U' L' U2 l",
    descriptionVi: 'Hình góc chữ L nhỏ (Frying Pan trái): Double Wide Anti-Sune.',
    descriptionEn: 'Frying Pan left: Wide double Anti-Sune.',
    executionTipVi: 'Giống OLL 5 nhưng thêm 1 nhịp L\' U\' L U ở giữa.', executionTipEn: 'Extended OLL 5.',
    difficulty: 'Intermediate', orderIndex: 53
  },
  {
    id: 254, category: 'OLL', subCategory: 'Hình chữ L nhỏ', code: 'OLL 54',
    name: 'Trường hợp 54', notation: "r U2 R' U' R U R' U' R U' r'",
    setupMoves: "r U R' U R U' R' U R U2 r'",
    descriptionVi: 'Hình góc chữ L nhỏ (Frying Pan phải - đối xứng OLL 53).',
    descriptionEn: 'Frying Pan right: Wide OLL 21.',
    executionTipVi: 'Giống hệt OLL 21 (H-Shape) nhưng thay R đầu/cuối bằng r/r\'.', executionTipEn: 'Identical to OLL 21 with wide r start/end.',
    difficulty: 'Intermediate', orderIndex: 54
  },
  {
    id: 255, category: 'OLL', subCategory: 'Hình chữ I', code: 'OLL 55',
    name: 'Trường hợp 55', notation: "R' F R U R U' R2 F' R2 U' R' U R U R'",
    alternativeNotation: "R U2 R2 U' R U' R' U2 F R F'",
    setupMoves: "R U' R' U' R U R2 F R2 U R' U' R' F' R",
    descriptionVi: 'Hình thanh dọc chữ I (Highway): 2 thanh 3 vàng đối diện ở hai bên.',
    descriptionEn: 'Highway I-Shape: Two opposing 3-bars on left and right.',
    executionTipVi: 'Công thức không đổi tay cầm rất mượt.', executionTipEn: 'Fast regripless execution.',
    difficulty: 'Advanced', orderIndex: 55
  },
  {
    id: 256, category: 'OLL', subCategory: 'Hình chữ I', code: 'OLL 56',
    name: 'Trường hợp 56', notation: "r' U' r U' R' U R U' R' U R r' U r",
    setupMoves: "r' U' r R' U' R U R' U' R U r' U r",
    descriptionVi: 'Hình thanh ngang chữ I (Streetlights): Headlights ở cả hai bên trái và phải.',
    descriptionEn: 'Streetlights I-Shape.',
    executionTipVi: 'r\' U\' r + 2 lần (U\' R\' U R) + r\' U r cực dễ nhớ.', executionTipEn: 'r\' U\' r + double (U\' R\' U R) + r\' U r.',
    difficulty: 'Intermediate', orderIndex: 56
  },
  {
    id: 257, category: 'OLL', subCategory: 'Đúng hết góc', code: 'OLL 57',
    name: 'Trường hợp 57', notation: "R U R' U' M' U R U' r'",
    setupMoves: "r U R' U' M U R U' R'",
    descriptionVi: 'Đúng hết 4 góc (Hình chữ H / Mummy): 2 cạnh đối diện bị lật.',
    descriptionEn: 'H-Shape / All corners oriented, 2 opposite edges flipped.',
    executionTipVi: 'Chỉ 8 bước siêu tốc độ để lật 2 cạnh đối diện.', executionTipEn: 'Blazing fast 8-move opposite edge flip.',
    difficulty: 'Beginner', orderIndex: 57, isFavorite: true
  },

  // ==================== CFOP: PLL (21 trường hợp chuẩn) ====================
  {
    id: 301, category: 'PLL', subCategory: 'Hoán vị cạnh', code: 'PLL Ub',
    name: 'Hoán vị Ub', notation: "R2 U R U R' U' R' U' R' U R'",
    alternativeNotation: "M2 U' M U2 M' U' M2",
    setupMoves: "R U' R U R U R U' R' U' R2",
    descriptionVi: 'Hoán vị 3 cạnh theo chiều kim đồng hồ (Trái → Phải → Trước → Trái), thanh hoàn chỉnh nằm ở mặt sau.',
    descriptionEn: 'Cycles 3 edges clockwise (L -> R -> F -> L), solved bar at back.',
    executionTipVi: 'Có thể dùng M2 U\' M U2 M\' U\' M2 cực nhanh dưới 0.7 giây.', executionTipEn: 'M-slice variant is blazing fast.',
    difficulty: 'Beginner', orderIndex: 1, userStatus: 'Mastered', isFavorite: true
  },
  {
    id: 302, category: 'PLL', subCategory: 'Hoán vị cạnh', code: 'PLL Ua',
    name: 'Hoán vị Ua', notation: "R U' R U R U R U' R' U' R2",
    alternativeNotation: "M2 U M U2 M' U M2",
    setupMoves: "R2 U R U R' U' R' U' R' U R'",
    descriptionVi: 'Hoán vị 3 cạnh ngược chiều kim đồng hồ (Phải → Trái → Trước → Phải), thanh hoàn chỉnh nằm ở mặt sau.',
    descriptionEn: 'Cycles 3 edges counter-clockwise (R -> L -> F -> R), solved bar at back.',
    executionTipVi: 'Thuật toán 2-gen R-U hoặc dùng tầng M đều cực mượt.', executionTipEn: 'Pure 2-gen R-U or M-slice.',
    difficulty: 'Beginner', orderIndex: 2, userStatus: 'Mastered', isFavorite: true
  },
  {
    id: 303, category: 'PLL', subCategory: 'Hoán vị cạnh', code: 'PLL Z',
    name: 'Hoán vị Z', notation: "M2 U M2 U M' U2 M2 U2 M' U2",
    alternativeNotation: "M' U' M2 U' M2 U' M' U2 M2 U",
    setupMoves: "U2 M U2 M2 U2 M U' M2 U' M2",
    descriptionVi: 'Hoán vị 2 cặp cạnh liền kề (Sau ↔ Trái và Trước ↔ Phải), 4 góc đã đúng vị trí.',
    descriptionEn: 'Swaps two pairs of adjacent edges (B <-> L and F <-> R).',
    executionTipVi: 'Nhịp M2 kết hợp U và U2 rất dễ thuộc.', executionTipEn: 'Rhythmic M2 and U/U2 turns.',
    difficulty: 'Beginner', orderIndex: 3, userStatus: 'Practicing'
  },
  {
    id: 304, category: 'PLL', subCategory: 'Hoán vị cạnh', code: 'PLL H',
    name: 'Hoán vị H', notation: "M2 U M2 U2 M2 U M2",
    alternativeNotation: "M2 U' M2 U2 M2 U' M2",
    setupMoves: "M2 U' M2 U2 M2 U' M2",
    descriptionVi: 'Hoán vị chéo 2 cặp cạnh đối diện nhau (Trước ↔ Sau và Trái ↔ Phải).',
    descriptionEn: 'Swaps opposing pairs of edges (F <-> B and L <-> R).',
    executionTipVi: 'Một trong những PLL nhanh và đối xứng nhất của CFOP.', executionTipEn: 'Symmetric and ultra-fast M2 trigger.',
    difficulty: 'Beginner', orderIndex: 4, userStatus: 'Mastered', isFavorite: true
  },
  {
    id: 305, category: 'PLL', subCategory: 'Hoán vị góc', code: 'PLL Aa',
    name: 'Hoán vị Aa', notation: "x R' U R' D2 R U' R' D2 R2 x'",
    alternativeNotation: "r' U r' D2 r U' r' D2 r2",
    setupMoves: "x R2 D2 R U R' D2 R U' R x'",
    descriptionVi: 'Hoán vị 3 góc theo chiều kim đồng hồ (Sau-Trái → Sau-Phải → Trước-Phải), khối 2x2x1 hoàn chỉnh ở Trước-Trái.',
    descriptionEn: 'Cycles 3 corners clockwise, solved 2x2 block at front-left.',
    executionTipVi: 'Dùng ngón áp út và ngón giữa tay trái gảy D2 liên hoàn.', executionTipEn: 'Double-flick D2 with left ring-middle fingers.',
    difficulty: 'Beginner', orderIndex: 5, userStatus: 'Mastered'
  },
  {
    id: 306, category: 'PLL', subCategory: 'Hoán vị góc', code: 'PLL Ab',
    name: 'Hoán vị Ab', notation: "x R2 D2 R U R' D2 R U' R x'",
    alternativeNotation: "r2 D2 r U r' D2 r U' r",
    setupMoves: "x R' U R' D2 R U' R' D2 R2 x'",
    descriptionVi: 'Hoán vị 3 góc ngược chiều kim đồng hồ (nghịch đảo chính xác của PLL Aa).',
    descriptionEn: 'Cycles 3 corners counter-clockwise (inverse of Aa).',
    executionTipVi: 'Nghịch đảo hoàn toàn của PLL Aa.', executionTipEn: 'Exact inverse of PLL Aa.',
    difficulty: 'Beginner', orderIndex: 6, userStatus: 'Mastered'
  },
  {
    id: 307, category: 'PLL', subCategory: 'Hoán vị góc', code: 'PLL E',
    name: 'Hoán vị E', notation: "x' R U' R' D R U R' D' R U R' D R U' R' D' x",
    setupMoves: "x' D R U R' D' R U' R' D R U' R' D' R U R' x",
    descriptionVi: 'Hoán vị song song 2 cặp góc bên trái và bên phải (Sau-Trái ↔ Trước-Trái và Sau-Phải ↔ Trước-Phải).',
    descriptionEn: 'Swaps two pairs of adjacent corners (BL <-> FL and BR <-> FR).',
    executionTipVi: '4 nhịp R-U-D liên hoàn cực kỳ êm tay.', executionTipEn: 'Four rhythmic R-U-D commutator triggers.',
    difficulty: 'Intermediate', orderIndex: 7
  },
  {
    id: 308, category: 'PLL', subCategory: 'Hoán vị G', code: 'PLL Ga',
    name: 'Hoán vị Ga', notation: "R2 U R' U R' U' R U' R2 D U' R' U R D'",
    setupMoves: "D R' U' R U D' R2 U R' U R U' R U' R2",
    descriptionVi: 'Hoán vị 3 góc và 3 cạnh: Headlights bên trái, thanh 2 viên nằm ở mặt trước-phải.',
    descriptionEn: 'G-Perm a: Headlights on left, 2-bar at front-right.',
    executionTipVi: 'Thực hiện D và U\' đồng thời bằng hai tay để tiết kiệm nhịp.', executionTipEn: 'Execute D and U\' simultaneously.',
    difficulty: 'Advanced', orderIndex: 8
  },
  {
    id: 309, category: 'PLL', subCategory: 'Hoán vị G', code: 'PLL Gb',
    name: 'Hoán vị Gb', notation: "R' U' R U D' R2 U R' U R U' R U' R2 D",
    setupMoves: "D' R2 U R' U R' U' R U' R2 D U' R' U R",
    descriptionVi: 'Hoán vị 3 góc và 3 cạnh (nghịch đảo của Ga): Headlights bên trái, thanh 2 viên ở sau-phải.',
    descriptionEn: 'G-Perm b: Inverse of Ga.',
    executionTipVi: 'Thực hiện U và D\' cùng lúc ở bước thứ 4.', executionTipEn: 'Simultaneous U and D\' on move 4.',
    difficulty: 'Advanced', orderIndex: 9
  },
  {
    id: 310, category: 'PLL', subCategory: 'Hoán vị G', code: 'PLL Gc',
    name: 'Hoán vị Gc', notation: "y2 R2 U' R U' R U R' U R2 D' U R U' R' D y2",
    alternativeNotation: "R2 F2 R U2 R U2 R' F R U R' U' R' F R2",
    setupMoves: "y2 D' R U R' U' D R2 U' R U' R' U R' U R2 y2",
    descriptionVi: 'Hoán vị 3 góc và 3 cạnh: Headlights bên phải, thanh 2 viên ở sau-trái.',
    descriptionEn: 'G-Perm c: Mirror of Ga.',
    executionTipVi: 'Có thể dùng công thức R2 F2 không cần xoay D.', executionTipEn: 'R2 F2 alternative is very fast.',
    difficulty: 'Advanced', orderIndex: 10
  },
  {
    id: 311, category: 'PLL', subCategory: 'Hoán vị G', code: 'PLL Gd',
    name: 'Hoán vị Gd', notation: "R U R' U' D R2 U' R U' R' U R' U R2 D'",
    setupMoves: "D R2 U' R U' R U R' U R2 D' U R U' R'",
    descriptionVi: 'Hoán vị 3 góc và 3 cạnh: Headlights bên trái, thanh 2 viên ở mặt sau-trái.',
    descriptionEn: 'G-Perm d: Inverse of Gc.',
    executionTipVi: 'Thực hiện U\' và D đồng thời ngay sau R U R\'.', executionTipEn: 'Simultaneous U\' and D after R U R\'.',
    difficulty: 'Advanced', orderIndex: 11
  },
  {
    id: 312, category: 'PLL', subCategory: 'Hoán vị liền kề', code: 'PLL Ra',
    name: 'Hoán vị Ra', notation: "R U' R' U' R U R D R' U' R D' R' U2 R' U'",
    setupMoves: "U R U2 R D R' U R D' R' U' R' U R U R'",
    descriptionVi: 'Hoán vị 2 góc bên phải (Sau-Phải ↔ Trước-Phải) và 2 cạnh liền kề (Sau ↔ Trái).',
    descriptionEn: 'R-Perm a: Headlights on right, swaps BR<->FR corners and B<->L edges.',
    executionTipVi: 'Công thức RUD hiện đại không cần đổi thế tay cầm.', executionTipEn: 'Modern regripless RUD algorithm.',
    difficulty: 'Intermediate', orderIndex: 12
  },
  {
    id: 313, category: 'PLL', subCategory: 'Hoán vị liền kề', code: 'PLL Rb',
    name: 'Hoán vị Rb', notation: "R' U2 R U2 R' F R U R' U' R' F' R2 U'",
    setupMoves: "U R2 F R U R U' R' F' R U2 R' U2 R",
    descriptionVi: 'Hoán vị 2 góc phía sau (Sau-Trái ↔ Sau-Phải) và 2 cạnh liền kề (Trước ↔ Phải).',
    descriptionEn: 'R-Perm b: Headlights at back, swaps BL<->BR corners and F<->R edges.',
    executionTipVi: 'Nhịp R\' U2 R U2 R\' F rất thuận tay phải.', executionTipEn: 'Smooth right-handed rhythm.',
    difficulty: 'Intermediate', orderIndex: 13
  },
  {
    id: 24, category: 'PLL', subCategory: 'Hoán vị liền kề', code: 'PLL Ja',
    name: 'Hoán vị Ja', notation: "R' U L' U2 R U' R' U2 R L U'",
    alternativeNotation: "x R2 F R F' R U2 r' U r U2 x'",
    setupMoves: "U L' R' U2 R U R' U2 L U' R",
    descriptionVi: 'Hoán vị 2 góc phía sau (Sau-Trái ↔ Sau-Phải) và 2 cạnh liền kề (Sau ↔ Trái), dải 1x2x3 hoàn chỉnh ở Trước-Phải.',
    descriptionEn: 'J-Perm a: Solved block at front/right, swaps BL<->BR corners and B<->L edges.',
    executionTipVi: 'Có thể dùng x R2 F R F\' R U2 r\' U r U2 x\' siêu tốc độ.', executionTipEn: 'x R2 F R F\' variant is blazing fast.',
    difficulty: 'Intermediate', orderIndex: 14, userStatus: 'Practicing'
  },
  {
    id: 23, category: 'PLL', subCategory: 'Hoán vị liền kề', code: 'PLL Jb',
    name: 'Hoán vị Jb', notation: "R U R' F' R U R' U' R' F R2 U' R' U'",
    setupMoves: "U R U R2 F' R U R U' R' F R U' R'",
    descriptionVi: 'Dải khối 1x2x3 hoàn chỉnh bên trái, hoán vị 2 góc bên phải và 2 cạnh Trước ↔ Phải.',
    descriptionEn: 'J-Perm b: Solved 1x2x3 block on left, swaps BR<->FR corners and F<->R edges.',
    executionTipVi: 'Một trong những thuật toán PLL nhanh nhất thế giới (dễ dàng sub-0.65s).', executionTipEn: 'One of the fastest PLLs in speedcubing.',
    difficulty: 'Beginner', orderIndex: 15, userStatus: 'Mastered', isFavorite: true
  },
  {
    id: 17, category: 'PLL', subCategory: 'Hoán vị liền kề', code: 'PLL T',
    name: 'Hoán vị T', notation: "R U R' U' R' F R2 U' R' U' R U R' F'",
    setupMoves: "F R U' R' U R U R2 F' R U R U' R'",
    descriptionVi: 'Hoán vị 2 góc bên phải (Sau-Phải ↔ Trước-Phải) và 2 cạnh đối diện (Trái ↔ Phải) tạo hình chữ T kinh điển.',
    descriptionEn: 'T-Perm: Swaps BR<->FR corners and L<->R edges.',
    executionTipVi: 'Chia làm 3 nhịp: Sexy Move -> R\' F R2 U\' R\' U\' -> R U R\' F\'.', executionTipEn: 'The most essential PLL algorithm.',
    difficulty: 'Beginner', orderIndex: 16, userStatus: 'Mastered', isFavorite: true
  },
  {
    id: 317, category: 'PLL', subCategory: 'Hoán vị liền kề', code: 'PLL F',
    name: 'Hoán vị F', notation: "R' U' F' R U R' U' R' F R2 U' R' U' R U R' U R",
    setupMoves: "R' U' R U' R' U R U R2 F' R U R U' R' F U R",
    descriptionVi: 'Dải khối 1x2x3 hoàn chỉnh bên trái, hoán vị 2 góc bên phải và 2 cạnh đối diện (Trước ↔ Sau).',
    descriptionEn: 'F-Perm: Solved 1x2x3 bar on left, swaps BR<->FR corners and F<->B edges.',
    executionTipVi: 'Chính là T-Perm được kẹp giữa bước setup R\' U\' F\' và U R.', executionTipEn: 'T-Perm conjugated with R\' U\' F\'.',
    difficulty: 'Intermediate', orderIndex: 17
  },
  {
    id: 318, category: 'PLL', subCategory: 'Hoán vị chéo', code: 'PLL V',
    name: 'Hoán vị V', notation: "y' R' U R' U' R D' R' D R' U D' R2 U' R2 D R2 y",
    alternativeNotation: "R' U R' U' y R' F' R2 U' R' U R' F R F",
    setupMoves: "y' R2 D' R2 U R2 D U' R D' R D R' U R U' R y",
    descriptionVi: 'Hoán vị 2 góc chéo nhau (Sau-Phải ↔ Trước-Trái) và 2 cạnh liền kề (Trước ↔ Phải), khối 2x2 hoàn chỉnh ở Sau-Trái.',
    descriptionEn: 'V-Perm: Swaps diagonal corners BR<->FL and adjacent edges F<->R.',
    executionTipVi: 'Công thức RUD giúp không cần xoay khối giữa chừng.', executionTipEn: 'Modern RUD execution.',
    difficulty: 'Advanced', orderIndex: 18
  },
  {
    id: 18, category: 'PLL', subCategory: 'Hoán vị chéo', code: 'PLL Y',
    name: 'Hoán vị Y', notation: "F R U' R' U' R U R' F' R U R' U' R' F R F'",
    setupMoves: "F R' F' R U R U' R' F R U' R' U R U R' F'",
    descriptionVi: 'Hoán vị 2 góc chéo nhau (Sau-Trái ↔ Trước-Phải) và 2 cạnh liền kề (Sau ↔ Trái) tạo hình chữ Y.',
    descriptionEn: 'Y-Perm: Swaps diagonal corners BL<->FR and adjacent edges B<->L.',
    executionTipVi: 'Ghép bởi 2 công thức OLL 37 và OLL 33 nối tiếp nhau cực dễ nhớ.', executionTipEn: 'Combo of two fast OLL triggers.',
    difficulty: 'Beginner', orderIndex: 19, userStatus: 'Mastered', isFavorite: true
  },
  {
    id: 320, category: 'PLL', subCategory: 'Hoán vị chéo', code: 'PLL Na',
    name: 'Hoán vị Na', notation: "R U R' U R U R' F' R U R' U' R' F R2 U' R' U2 R U' R'",
    setupMoves: "R U R' U2 R U R2 F' R U R U' R' F R U' R' U' R U' R'",
    descriptionVi: 'Hoán vị chéo 2 góc (Sau-Phải ↔ Trước-Trái) và 2 cạnh đối diện (Trái ↔ Phải).',
    descriptionEn: 'N-Perm a: Swaps diagonal corners BR<->FL and opposite edges L<->R.',
    executionTipVi: 'Chính là Jb-Perm được kẹp giữa R U R\' U và U2 R U\' R\'.', executionTipEn: 'Jb-Perm conjugated with R U R\' U.',
    difficulty: 'Advanced', orderIndex: 20
  },
  {
    id: 321, category: 'PLL', subCategory: 'Hoán vị chéo', code: 'PLL Nb',
    name: 'Hoán vị Nb', notation: "R' U R U' R' F' U' F R U R' F R' F' R U' R",
    setupMoves: "R' U R' F R F' R U' R' F' U F R U R' U' R",
    descriptionVi: 'Hoán vị chéo 2 góc (Sau-Trái ↔ Trước-Phải) và 2 cạnh đối diện (Trái ↔ Phải) — đối xứng với Na.',
    descriptionEn: 'N-Perm b: Swaps diagonal corners BL<->FR and opposite edges L<->R.',
    executionTipVi: 'Công thức không xoay khối kết hợp Sledgehammer ở cuối.', executionTipEn: 'Rotationless Sledgehammer finish.',
    difficulty: 'Advanced', orderIndex: 21
  }
];
