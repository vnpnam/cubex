using Cubex.Api.Entities;
using Microsoft.AspNetCore.Identity;

namespace Cubex.Api.Data;

public static class SeedData
{
    public static async Task InitializeAsync(
        CubexDbContext context,
        UserManager<ApplicationUser> userManager,
        RoleManager<IdentityRole> roleManager)
    {
        // 1. Roles
        string[] roles = { "Admin", "Cubist" };
        foreach (var role in roles)
        {
            if (!await roleManager.RoleExistsAsync(role))
            {
                await roleManager.CreateAsync(new IdentityRole(role));
            }
        }

        // 2. Admin User
        var adminEmail = "admin@cubex.com";
        var admin = await userManager.FindByEmailAsync(adminEmail);
        if (admin == null)
        {
            admin = new ApplicationUser
            {
                UserName = adminEmail,
                Email = adminEmail,
                DisplayName = "Cubex Administrator",
                WcaId = "2026CUBE01",
                Bio = "CUBEX Lead Architect and Speedcubing Coach.",
                EmailConfirmed = true,
                PreferredLanguage = "vi",
                ThemePreference = "dark",
                CreatedAt = DateTime.UtcNow.AddMonths(-3)
            };
            var result = await userManager.CreateAsync(admin, "CubexAdmin2026!");
            if (result.Succeeded)
            {
                await userManager.AddToRolesAsync(admin, new[] { "Admin", "Cubist" });
            }
        }

        // 3. Demo Speedcuber User
        var cubistEmail = "cubist@cubex.com";
        var cubist = await userManager.FindByEmailAsync(cubistEmail);
        if (cubist == null)
        {
            cubist = new ApplicationUser
            {
                UserName = cubistEmail,
                Email = cubistEmail,
                DisplayName = "Minh Speedcuber",
                WcaId = "2025MINH02",
                Bio = "CFOP Sub-12 solver aiming for Sub-10 in 2026. Custom Moyu RS3M V5.",
                EmailConfirmed = true,
                PreferredLanguage = "vi",
                ThemePreference = "dark",
                CreatedAt = DateTime.UtcNow.AddMonths(-1)
            };
            var result = await userManager.CreateAsync(cubist, "CubexPro2026!");
            if (result.Succeeded)
            {
                await userManager.AddToRoleAsync(cubist, "Cubist");
            }
        }

        // 4. Algorithms
        if (!context.Algorithms.Any())
        {
            var algorithms = GetPredefinedAlgorithms();
            await context.Algorithms.AddRangeAsync(algorithms);
            await context.SaveChangesAsync();
        }

        // 5. Seed Sessions and Solves for Demo User
        if (cubist != null && !context.SolveSessions.Any(s => s.UserId == cubist.Id))
        {
            var mainSession = new SolveSession
            {
                UserId = cubist.Id,
                Name = "Main 3x3x3",
                PuzzleType = "3x3x3",
                CreatedAt = DateTime.UtcNow.AddDays(-14),
                IsActive = true
            };
            var drillSession = new SolveSession
            {
                UserId = cubist.Id,
                Name = "OLL / PLL Drills",
                PuzzleType = "3x3x3",
                CreatedAt = DateTime.UtcNow.AddDays(-7),
                IsActive = false
            };

            await context.SolveSessions.AddRangeAsync(mainSession, drillSession);
            await context.SaveChangesAsync();

            // Seed realistic solve times (sub-12 progression)
            var baseSolves = new (int ms, string scramble, SolvePenalty penalty, string? note)[]
            {
                (14230, "R2 D' B2 L2 U2 F2 D B2 R2 B' U R2 F2 R' D' B' F2 U B2 R'", SolvePenalty.None, "Smooth cross"),
                (13120, "D2 F2 R2 D2 B2 R' D2 F2 L2 F2 R F' D L2 B2 F' U' B F2 D2", SolvePenalty.None, "Quick F2L"),
                (11850, "B2 D2 F2 L' U2 R B2 R' U2 R' U2 F' D2 L' U' B' D' R' F2 D", SolvePenalty.None, "Fast PLL skip"),
                (12430, "U' F2 U' L2 D B2 R2 F2 D' B2 D' F' L2 R B' F' L2 D2 U' R2", SolvePenalty.None, null),
                (10940, "R2 U' L2 D2 B2 F2 D' L2 B2 D2 F R' D2 F2 U L2 U F R' U2", SolvePenalty.None, "PB single! Smooth T-perm"),
                (12880, "L2 D2 B2 U2 R2 B2 D2 L2 F' D2 F' L F' D U' L B D F2 R'", SolvePenalty.None, null),
                (15120, "F2 R2 U2 B2 R2 D2 F2 U2 R' D2 L B L2 F D2 U R' B' R' F", SolvePenalty.PlusTwo, "+2 AUF misalignment"),
                (11420, "D2 L2 F2 U' B2 U F2 D2 R2 B2 U' B L B2 D' L2 R' U' L2 B", SolvePenalty.None, "Clean OLL 33"),
                (12100, "B2 R2 D2 F2 U2 R2 U' B2 R2 D' F' L2 R D B' F' L' U2 B2", SolvePenalty.None, null),
                (11980, "U2 B2 R2 U' B2 D' L2 D2 L2 R2 U B' L' R' F' D B2 R B2 F", SolvePenalty.None, "Ao5 PR!"),
                (13540, "D' L2 F2 R2 U' L2 D2 F2 D2 R2 D' F' R2 B L D' B' F2 R' B2", SolvePenalty.None, null),
                (10820, "R2 B2 U2 F2 D2 L2 U' R2 D' L2 F' R D B2 F' L U' R' B' F'", SolvePenalty.None, "Sub-11! Easy cross + free pair")
            };

            var timestamp = DateTime.UtcNow.AddDays(-6);
            foreach (var item in baseSolves)
            {
                int effectiveTime = item.penalty == SolvePenalty.PlusTwo ? item.ms + 2000 : item.ms;
                context.Solves.Add(new Solve
                {
                    UserId = cubist.Id,
                    SessionId = mainSession.Id,
                    RawTimeMs = item.ms,
                    TimeMs = effectiveTime,
                    Penalty = item.penalty,
                    Scramble = item.scramble,
                    Timestamp = timestamp,
                    Notes = item.note,
                    Tags = item.ms < 11500 ? "PB" : null
                });
                timestamp = timestamp.AddHours(4);
            }

            // Seed user progress on algorithms
            var firstAlgs = context.Algorithms.Take(12).ToList();
            int idx = 0;
            foreach (var alg in firstAlgs)
            {
                context.UserAlgorithmProgresses.Add(new UserAlgorithmProgress
                {
                    UserId = cubist.Id,
                    AlgorithmId = alg.Id,
                    Status = idx < 5 ? MasteryStatus.Mastered : (idx < 9 ? MasteryStatus.Practicing : MasteryStatus.Learning),
                    IsFavorite = idx == 0 || idx == 4,
                    PracticeCount = 20 - idx,
                    PersonalBestTimeMs = 1200 + (idx * 150),
                    LastPracticedAt = DateTime.UtcNow.AddDays(-idx)
                });
                idx++;
            }

            await context.SaveChangesAsync();
        }
    }

    public static List<Algorithm> GetPredefinedAlgorithms()
    {
        return new List<Algorithm>
        {
            // ==================== BEGINNER METHOD ====================
            new()
            {
                Category = AlgorithmCategory.Beginner,
                SubCategory = "Daisy & White Cross",
                Code = "BEG-01",
                Name = "White Cross Orientation",
                Notation = "F2",
                AlternativeNotation = "R2 / L2 / B2",
                SetupMoves = "F2",
                DescriptionVi = "Xoay tầng chứa cạnh màu trắng thẳng hàng với tâm tương ứng rồi quay 180 độ (F2) đưa về đáy trắng.",
                DescriptionEn = "Match the white edge color with its side center, then turn 180 degrees (F2) into the white bottom.",
                ExecutionTipVi = "Nhìn màu tâm bên hông trước khi xoay F2 để tránh sai vị trí.",
                ExecutionTipEn = "Align the side color with the matching center before doing F2.",
                Difficulty = AlgorithmDifficulty.Beginner,
                OrderIndex = 1
            },
            new()
            {
                Category = AlgorithmCategory.Beginner,
                SubCategory = "First Layer Corners",
                Code = "BEG-02",
                Name = "The Sexy Move",
                Notation = "R U R' U'",
                AlternativeNotation = "(R U R' U') x3",
                SetupMoves = "U R U' R'",
                DescriptionVi = "Công thức nền tảng 4 bước của Speedcubing dùng để giải góc tầng 1 và chuẩn bị cho nhiều kỹ thuật nâng cao.",
                DescriptionEn = "The fundamental 4-move trigger in speedcubing used to slot first layer corners and build muscle memory.",
                ExecutionTipVi = "Dùng ngón trỏ phải để gảy U, ngón cái giữ mặt F.",
                ExecutionTipEn = "Use your right index finger for the U push, keeping right thumb on F.",
                Difficulty = AlgorithmDifficulty.Beginner,
                OrderIndex = 2
            },
            new()
            {
                Category = AlgorithmCategory.Beginner,
                SubCategory = "Second Layer Edges",
                Code = "BEG-03",
                Name = "Right Edge Insertion",
                Notation = "U R U' R' U' F' U F",
                AlternativeNotation = "U (R U' R') (F R' F' R)",
                SetupMoves = "F' U' F U R U R' U'",
                DescriptionVi = "Đưa viên cạnh từ tầng 3 vào khe bên phải của tầng 2 mà không làm xáo trộn tầng 1.",
                DescriptionEn = "Insert an edge from the top layer into the right front middle slot without disturbing layer 1.",
                ExecutionTipVi = "Tách làm 2 cặp: (U R U' R') rồi xoay người hoặc gảy ngón trỏ F' (U' F' U F).",
                ExecutionTipEn = "Split into 2 triggers: sexy pair push then sledgehammer/F turn.",
                Difficulty = AlgorithmDifficulty.Beginner,
                OrderIndex = 3
            },
            new()
            {
                Category = AlgorithmCategory.Beginner,
                SubCategory = "Second Layer Edges",
                Code = "BEG-04",
                Name = "Left Edge Insertion",
                Notation = "U' L' U L U F U' F'",
                AlternativeNotation = "y U' (R' U R) (F' R F R')",
                SetupMoves = "F U F' U' L' U' L U",
                DescriptionVi = "Đưa viên cạnh từ tầng 3 vào khe bên trái của tầng 2.",
                DescriptionEn = "Insert an edge from the top layer into the left front middle slot.",
                ExecutionTipVi = "Đối xứng hoàn toàn với công thức bên phải, dùng tay trái thao tác.",
                ExecutionTipEn = "Exact mirror of right insertion, practice with your left hand.",
                Difficulty = AlgorithmDifficulty.Beginner,
                OrderIndex = 4
            },
            new()
            {
                Category = AlgorithmCategory.Beginner,
                SubCategory = "Yellow Cross",
                Code = "BEG-05",
                Name = "F-Sexy-F' (FRUR'U'F')",
                Notation = "F R U R' U' F'",
                AlternativeNotation = "F (R U R' U') F'",
                SetupMoves = "F U R U' R' F'",
                DescriptionVi = "Biến hình chữ L hoặc đường thẳng màu vàng thành dấu cộng chữ thập màu vàng trên đỉnh.",
                DescriptionEn = "Turns an L-shape or horizontal line of yellow edges into a full yellow cross.",
                ExecutionTipVi = "Mở mặt F bằng ngón cái phải, chạy Sexy Move rồi gạt F' về bằng ngón trỏ.",
                ExecutionTipEn = "Thumb turn F, execute quick Sexy Move, snap F' back with right index.",
                Difficulty = AlgorithmDifficulty.Beginner,
                OrderIndex = 5
            },
            new()
            {
                Category = AlgorithmCategory.Beginner,
                SubCategory = "Last Layer Corners",
                Code = "BEG-06",
                Name = "Sune (Yellow Face)",
                Notation = "R U R' U R U2 R'",
                AlternativeNotation = "R U R' U R U2' R'",
                SetupMoves = "R U2 R' U' R U' R'",
                DescriptionVi = "Định hướng tất cả các góc vàng lên trên khi đã có dấu thập vàng.",
                DescriptionEn = "Orients all yellow corners to face up once the yellow cross is formed.",
                ExecutionTipVi = "Gảy U2 bằng ngón trỏ kéo tiếp ngón giữa (double flick) cực nhanh.",
                ExecutionTipEn = "Execute U2 with an index-middle finger double flick for speed.",
                Difficulty = AlgorithmDifficulty.Beginner,
                OrderIndex = 6
            },

            // ==================== CROSS TRAINING ====================
            new()
            {
                Category = AlgorithmCategory.Cross,
                SubCategory = "Inspection & Planning",
                Code = "CRS-01",
                Name = "Direct 4-Move Cross",
                Notation = "D R F' D'",
                AlternativeNotation = "F R' D2 F'",
                SetupMoves = "D F R' D'",
                DescriptionVi = "Giải chữ thập trắng trong 4 bước tối ưu từ mọi góc nhìn trong thời gian 15 giây quan sát.",
                DescriptionEn = "Optimal 4-move white cross planned completely during the 15-second inspection.",
                ExecutionTipVi = "Tập nhắm mắt sau 15 giây quan sát để thực hiện trơn tru mà không cần nhìn.",
                ExecutionTipEn = "Practice blind execution after inspection to train lookahead into F2L.",
                Difficulty = AlgorithmDifficulty.Intermediate,
                OrderIndex = 1
            },
            new()
            {
                Category = AlgorithmCategory.Cross,
                SubCategory = "Color Neutrality",
                Code = "CRS-02",
                Name = "Opposite Cross (Yellow/White)",
                Notation = "R2 D' F2 R B'",
                AlternativeNotation = "L F2 D R2",
                SetupMoves = "B R' F2 D R2",
                DescriptionVi = "Luyện tập giải chữ thập vàng hoặc trắng tùy theo mặt nào có thế cờ ít bước hơn.",
                DescriptionEn = "Dual-color neutrality: choosing between white or yellow cross for fewer moves.",
                ExecutionTipVi = "Tiết kiệm trung bình 1.5 đến 2 giây cho bước khởi đầu.",
                ExecutionTipEn = "Saves an average of 1.5 to 2 moves in the initial cross solve.",
                Difficulty = AlgorithmDifficulty.Advanced,
                OrderIndex = 2
            },

            // ==================== CFOP: F2L ====================
            new()
            {
                Category = AlgorithmCategory.F2L,
                SubCategory = "Basic Inserts",
                Code = "F2L 01",
                Name = "Easy Right Slot Insert",
                Notation = "U (R U' R')",
                AlternativeNotation = "R U' R'",
                SetupMoves = "R U R' U'",
                DescriptionVi = "Viên góc và viên cạnh đã tạo thành cặp ở tầng 3, chỉ cần đưa vào khe bên phải.",
                DescriptionEn = "Corner and edge are already paired in top layer; insert directly into right slot.",
                ExecutionTipVi = "Không cần xoay cả khối rubik (rotationless).",
                ExecutionTipEn = "Rotationless insert directly into the front-right slot.",
                Difficulty = AlgorithmDifficulty.Beginner,
                OrderIndex = 1
            },
            new()
            {
                Category = AlgorithmCategory.F2L,
                SubCategory = "Basic Inserts",
                Code = "F2L 02",
                Name = "Easy Left Slot Insert",
                Notation = "y' U' (R' U R)",
                AlternativeNotation = "F' U F",
                SetupMoves = "y' R' U' R U",
                DescriptionVi = "Cặp F2L đã ghép sẵn đưa vào khe bên trái hoặc dùng F' U F rotationless.",
                DescriptionEn = "Paired F2L slotting into the front-left slot.",
                ExecutionTipVi = "Có thể dùng F' U F để tránh quay khối cube y'.",
                ExecutionTipEn = "Can use F' U F instead of rotating cube with y'.",
                Difficulty = AlgorithmDifficulty.Beginner,
                OrderIndex = 2
            },
            new()
            {
                Category = AlgorithmCategory.F2L,
                SubCategory = "Corner in U & Edge in U",
                Code = "F2L 03",
                Name = "Opposite Colors on Top",
                Notation = "U' (R U R') U2 (R U' R')",
                AlternativeNotation = "(R U R') U2 (R U' R')",
                SetupMoves = "R U R' U2 R U' R' U",
                DescriptionVi = "Màu đỉnh của góc và cạnh khác nhau, tách và tạo cặp qua 2 nhịp.",
                DescriptionEn = "Top colors of corner and edge are different; separate and pair in 2 triggers.",
                ExecutionTipVi = "Tận dụng khe trống để không ảnh hưởng các cặp khác.",
                ExecutionTipEn = "Keep the move sequence fluent without regrip.",
                Difficulty = AlgorithmDifficulty.Intermediate,
                OrderIndex = 3
            },
            new()
            {
                Category = AlgorithmCategory.F2L,
                SubCategory = "Corner in U & Edge in U",
                Code = "F2L 04",
                Name = "Same Color on Top",
                Notation = "(R U' R') U (R U' R' U2 R U' R')",
                AlternativeNotation = "y' (R' U R) U2 (R' U' R)",
                SetupMoves = "R U R' U2 R U R' U' R U R'",
                DescriptionVi = "Hai màu đỉnh giống nhau, giấu viên góc rồi đưa cạnh ghép cặp.",
                DescriptionEn = "Same color facing up on top layer; hide corner then align edge.",
                ExecutionTipVi = "Giấu viên góc xuống dưới bằng R' hoặc R tùy vị trí khe.",
                ExecutionTipEn = "Hide corner into bottom slot before aligning edge on top.",
                Difficulty = AlgorithmDifficulty.Intermediate,
                OrderIndex = 4
            },
            new()
            {
                Category = AlgorithmCategory.F2L,
                SubCategory = "White Facing Up",
                Code = "F2L 05",
                Name = "Corner White Up & Edge Free",
                Notation = "U (R U2' R') U (R U' R')",
                AlternativeNotation = "(R U2 R') U' (R U R')",
                SetupMoves = "R U R' U' R U2 R' U'",
                DescriptionVi = "Mặt trắng của góc hướng lên trời, đưa cạnh về vị trí đối xứng rồi lật góc.",
                DescriptionEn = "White sticker pointing upward; position edge opposite and pair down.",
                ExecutionTipVi = "Dùng double flick U2' bằng tay phải để tăng tốc độ lật góc.",
                ExecutionTipEn = "Use a quick right-hand U2' double flick to pair efficiently.",
                Difficulty = AlgorithmDifficulty.Intermediate,
                OrderIndex = 5
            },
            new()
            {
                Category = AlgorithmCategory.F2L,
                SubCategory = "Corner in Slot",
                Code = "F2L 06",
                Name = "Corner Solved, Edge Flipped",
                Notation = "(R U' R') d (R' U2 R) (R' U2 R)",
                AlternativeNotation = "(R U R' U') (R' F R F') (R U' R')",
                SetupMoves = "R' U2 R R' U2 R d' R U R'",
                DescriptionVi = "Góc đã ở đúng vị trí đáy nhưng cạnh bị lật ngược hoặc sai chiều trong khe.",
                DescriptionEn = "Corner is situated in slot but edge is flipped or inverted.",
                ExecutionTipVi = "Sledgehammer kết hợp Sexy Move giải quyết rất êm ái.",
                ExecutionTipEn = "Combining Sexy move with Sledgehammer avoids bulky regrips.",
                Difficulty = AlgorithmDifficulty.Advanced,
                OrderIndex = 6
            },

            // ==================== CFOP: OLL ====================
            new()
            {
                Category = AlgorithmCategory.OLL,
                SubCategory = "All Corners Oriented (Cross)",
                Code = "OLL 21",
                Name = "Cross H-Shape",
                Notation = "R U2 R' U' R U R' U' R U' R'",
                AlternativeNotation = "(R U R' U') (R U' R' U2) x2",
                SetupMoves = "R U R' U R U' R' U R U2 R'",
                DescriptionVi = "Dấu thập vàng đã hoàn thành, 4 góc vàng quay ra ngoài thành 2 cặp headlights đối diện.",
                DescriptionEn = "Cross is complete, 4 yellow corners point outward as opposing headlights.",
                ExecutionTipVi = "Có thể thực hiện F (R U R' U')3 F' cực kỳ nhanh.",
                ExecutionTipEn = "F (R U R' U')3 F' is an ultra-fast alternative trigger.",
                Difficulty = AlgorithmDifficulty.Intermediate,
                OrderIndex = 1
            },
            new()
            {
                Category = AlgorithmCategory.OLL,
                SubCategory = "All Corners Oriented (Cross)",
                Code = "OLL 22",
                Name = "Cross Pi-Shape",
                Notation = "R U2' R2' U' R2 U' R2' U2' R",
                AlternativeNotation = "f (R U R' U') f' F (R U R' U') F'",
                SetupMoves = "R' U2 R2 U R2 U R2 U2 R'",
                DescriptionVi = "Dấu thập vàng hoàn thành, 2 góc sau hướng về phía sau, 2 góc trước hướng ra 2 bên.",
                DescriptionEn = "Pi shape: 2 headlights pointing one way, other two pointing outward.",
                ExecutionTipVi = "Giữ ngón cái ở mặt F khi xoay R2' để điều khiển chuyển động U'.",
                ExecutionTipEn = "Maintain thumb on F during R2' for steady U' push.",
                Difficulty = AlgorithmDifficulty.Intermediate,
                OrderIndex = 2
            },
            new()
            {
                Category = AlgorithmCategory.OLL,
                SubCategory = "T-Shapes",
                Code = "OLL 33",
                Name = "T-Shape 1",
                Notation = "(R U R' U') (R' F R F')",
                AlternativeNotation = "Sexy Move + Sledgehammer",
                SetupMoves = "(F R' F' R) (U R U' R')",
                DescriptionVi = "Hình chữ T kinh điển: Sự kết hợp hoàn hảo giữa Sexy Move và Sledgehammer.",
                DescriptionEn = "The iconic T-shape OLL: Seamless combination of Sexy Move and Sledgehammer.",
                ExecutionTipVi = "Không cần đổi tay cầm (regripless), fingertrick mượt mà nhất trong 57 OLL.",
                ExecutionTipEn = "100% regripless, one of the fastest algorithms in speedcubing.",
                Difficulty = AlgorithmDifficulty.Beginner,
                OrderIndex = 3
            },
            new()
            {
                Category = AlgorithmCategory.OLL,
                SubCategory = "T-Shapes",
                Code = "OLL 45",
                Name = "T-Shape 2",
                Notation = "F (R U R' U') F'",
                AlternativeNotation = "F R U R' U' F'",
                SetupMoves = "F (U R U' R') F'",
                DescriptionVi = "Hình chữ T mặt trước, giải phóng toàn bộ đỉnh vàng chỉ với 6 bước.",
                DescriptionEn = "Front T-shape, solves yellow face in just 6 effortless moves.",
                ExecutionTipVi = "Dùng ngón trỏ gảy F' để kết thúc trong 0.6 giây.",
                ExecutionTipEn = "Snap F' with index finger to complete in under 0.6 seconds.",
                Difficulty = AlgorithmDifficulty.Beginner,
                OrderIndex = 4
            },
            new()
            {
                Category = AlgorithmCategory.OLL,
                SubCategory = "Dot Cases",
                Code = "OLL 01",
                Name = "Runway Dot",
                Notation = "R U2' R2' F R F' U2' R' F R F'",
                AlternativeNotation = "F (R U R' U') F' f (R U R' U') f'",
                SetupMoves = "F R' F' R U2 F R' F' R2 U2 R'",
                DescriptionVi = "Không có viên cạnh nào lật lên mặt vàng (chỉ có tâm vàng duy nhất).",
                DescriptionEn = "No yellow edges oriented on top, pure center dot case.",
                ExecutionTipVi = "Kết hợp 2 công thức 2-look OLL để ghi nhớ dễ dàng.",
                ExecutionTipEn = "Combine two 2-look OLL algorithms for effortless recall.",
                Difficulty = AlgorithmDifficulty.Advanced,
                OrderIndex = 5
            },
            new()
            {
                Category = AlgorithmCategory.OLL,
                SubCategory = "Knight Move Shapes",
                Code = "OLL 13",
                Name = "Gun / Knight Move",
                Notation = "F U R U' R2' F' R (U R U' R')",
                AlternativeNotation = "r U' r' U' r U r' y' R' U R",
                SetupMoves = "(R U R' U') R' F R2 U R' U' F'",
                DescriptionVi = "Thế cờ hình con mã cờ vua với 1 góc vàng đã lật đúng.",
                DescriptionEn = "Knight move shape with one yellow corner already oriented.",
                ExecutionTipVi = "Thực hiện R2' bằng cổ tay để chuẩn bị ngón cái cho F'.",
                ExecutionTipEn = "Smooth wrist turn on R2' to position thumb for F'.",
                Difficulty = AlgorithmDifficulty.Advanced,
                OrderIndex = 6
            },

            // ==================== CFOP: PLL (ALL KEY PERMS) ====================
            new()
            {
                Category = AlgorithmCategory.PLL,
                SubCategory = "Adjacent Swaps",
                Code = "PLL T",
                Name = "T-Permutation",
                Notation = "(R U R' U') R' F R2 U' R' U' (R U R') F'",
                AlternativeNotation = "(R U R' U') (R' F R2 U' R' U') (R U R' F')",
                SetupMoves = "F R U' R' U R U R2 F' R U R U' R'",
                DescriptionVi = "Hoán vị 2 góc và 2 cạnh liền kề tạo thành hình chữ T, công thức quan trọng nhất của PLL.",
                DescriptionEn = "Swaps two adjacent corners and two adjacent edges in a T shape. Most critical PLL.",
                ExecutionTipVi = "Chia làm 3 nhịp: Sexy Move -> R' F R2 U' R' U' -> R U R' F'.",
                ExecutionTipEn = "Execute as 3 distinct triggers: Sexy move, middle transition, sexy finish with F'.",
                Difficulty = AlgorithmDifficulty.Beginner,
                OrderIndex = 1
            },
            new()
            {
                Category = AlgorithmCategory.PLL,
                SubCategory = "Diagonal Swaps",
                Code = "PLL Y",
                Name = "Y-Permutation",
                Notation = "F R U' R' U' (R U R') F' (R U R' U') (R' F R F')",
                AlternativeNotation = "F R U' R' U' R U R' F' + T-Perm ending",
                SetupMoves = "(F R' F' R) (U R U' R') F R U' R' U' R U R' F'",
                DescriptionVi = "Hoán vị 2 góc chéo nhau và 2 cạnh liền kề, tạo thành hình chữ Y đặc trưng.",
                DescriptionEn = "Swaps two diagonal corners and two adjacent edges forming a Y pattern.",
                ExecutionTipVi = "Nửa đầu là OLL biến thể, nửa sau kết thúc bằng Sledgehammer.",
                ExecutionTipEn = "First half is modified OLL, second half ends with crisp sledgehammer.",
                Difficulty = AlgorithmDifficulty.Intermediate,
                OrderIndex = 2
            },
            new()
            {
                Category = AlgorithmCategory.PLL,
                SubCategory = "Edges Only",
                Code = "PLL Ua",
                Name = "Ua-Permutation",
                Notation = "M2 U M U2 M' U M2",
                AlternativeNotation = "R U' R U R U R U' R' U' R2",
                SetupMoves = "M2 U' M U2 M' U' M2",
                DescriptionVi = "Hoán vị 3 cạnh theo chiều kim đồng hồ, các góc giữ nguyên 100%.",
                DescriptionEn = "Cycles three edges clockwise while all four corners remain solved.",
                ExecutionTipVi = "Dùng ngón nhẫn và ngón giữa tay trái/phải để búng M2 (ring-middle flick).",
                ExecutionTipEn = "Use ring-middle finger flick on bottom M-slice for blazing sub-0.8s speed.",
                Difficulty = AlgorithmDifficulty.Beginner,
                OrderIndex = 3
            },
            new()
            {
                Category = AlgorithmCategory.PLL,
                SubCategory = "Edges Only",
                Code = "PLL Ub",
                Name = "Ub-Permutation",
                Notation = "M2 U' M U2 M' U' M2",
                AlternativeNotation = "R2 U (R U R' U') R' U' (R' U R')",
                SetupMoves = "M2 U M U2 M' U M2",
                DescriptionVi = "Hoán vị 3 cạnh ngược chiều kim đồng hồ, đối xứng với Ua.",
                DescriptionEn = "Cycles three edges counter-clockwise; mirror of Ua.",
                ExecutionTipVi = "Dùng ngón trỏ gạt U' ngược về.",
                ExecutionTipEn = "Index finger pull for U' between M-slice triggers.",
                Difficulty = AlgorithmDifficulty.Beginner,
                OrderIndex = 4
            },
            new()
            {
                Category = AlgorithmCategory.PLL,
                SubCategory = "Edges Only",
                Code = "PLL H",
                Name = "H-Permutation",
                Notation = "M2 U M2 U2 M2 U M2",
                AlternativeNotation = "M2 U' M2 U2 M2 U' M2",
                SetupMoves = "M2 U M2 U2 M2 U M2",
                DescriptionVi = "Hoán vị chéo 2 cặp cạnh đối diện nhau (Trước-Sau và Trái-Phải).",
                DescriptionEn = "Swaps opposing pairs of edges (Front-Back and Left-Right).",
                ExecutionTipVi = "M2 liên tục kết hợp flick U và U2, có thể đạt sub-0.7s dễ dàng.",
                ExecutionTipEn = "Rhythmic M2 turns with quick U/U2 flick, easily sub-0.7s with practice.",
                Difficulty = AlgorithmDifficulty.Beginner,
                OrderIndex = 5
            },
            new()
            {
                Category = AlgorithmCategory.PLL,
                SubCategory = "Edges Only",
                Code = "PLL Z",
                Name = "Z-Permutation",
                Notation = "M' U M2 U M2 U M' U2 M2",
                AlternativeNotation = "M2 U M2 U M' U2 M2 U2 M'",
                SetupMoves = "M2 U2 M' U' M2 U' M2 U' M",
                DescriptionVi = "Hoán vị 2 cặp cạnh liền kề (Trước-Phải và Sau-Trái).",
                DescriptionEn = "Swaps adjacent edge pairs in a zig-zag pattern.",
                ExecutionTipVi = "Ngón cái giữ nhẹ F để giữ thăng bằng khi kéo M'.",
                ExecutionTipEn = "Stabilize with thumb on front face during single M' pulls.",
                Difficulty = AlgorithmDifficulty.Intermediate,
                OrderIndex = 6
            },
            new()
            {
                Category = AlgorithmCategory.PLL,
                SubCategory = "Adjacent Swaps",
                Code = "PLL Jb",
                Name = "Jb-Permutation",
                Notation = "R U R' F' (R U R' U') R' F R2 U' R'",
                AlternativeNotation = "R U2 R' U' R U2 L' U R' U' L",
                SetupMoves = "R U R2 F' R U R U' R' F R U' R'",
                DescriptionVi = "Dải khối 1x2x3 đã hoàn thành bên trái, hoán vị góc và cạnh ngoài cùng.",
                DescriptionEn = "Solved 1x2x3 block on the left side, swaps adjacent corner and edge on right.",
                ExecutionTipVi = "Một trong những thuật toán nhanh nhất thế giới, thường thực hiện dưới 0.65s.",
                ExecutionTipEn = "One of the fastest PLL algorithms in competition, easily sub-0.65s.",
                Difficulty = AlgorithmDifficulty.Beginner,
                OrderIndex = 7
            },
            new()
            {
                Category = AlgorithmCategory.PLL,
                SubCategory = "Adjacent Swaps",
                Code = "PLL Ja",
                Name = "Ja-Permutation",
                Notation = "R' U L' U2 (R U' R') U2 R L",
                AlternativeNotation = "y2 L' U' L F (L' U' L U) L F' L2 U L",
                SetupMoves = "L' R' U2 R U R' U2 L U' R",
                DescriptionVi = "Dải khối hoàn thành bên phải, đối xứng với Jb.",
                DescriptionEn = "Solved block on the right, mirror of Jb permutation.",
                ExecutionTipVi = "Hoặc xoay y2 để dùng tay trái hoặc dùng công thức RUD.",
                ExecutionTipEn = "Can rotate y2 to use left-handed Jb or execute the direct R/L trigger.",
                Difficulty = AlgorithmDifficulty.Intermediate,
                OrderIndex = 8
            },
            new()
            {
                Category = AlgorithmCategory.PLL,
                SubCategory = "Corners Only",
                Code = "PLL Aa",
                Name = "Aa-Permutation",
                Notation = "x R' U R' D2 R U' R' D2 R2 x'",
                AlternativeNotation = "l' U R' D2 R U' R' D2 R2",
                SetupMoves = "x R2 D2 R U R' D2 R U' R x'",
                DescriptionVi = "Hoán vị 3 góc ngược chiều kim đồng hồ, tất cả các cạnh giữ nguyên.",
                DescriptionEn = "Cycles three corners counter-clockwise while all edges stay fixed.",
                ExecutionTipVi = "Nghiêng khối x để xoay D2 bằng ngón nhẫn và ngón giữa tay trái.",
                ExecutionTipEn = "Tilt cube with x rotation to double-flick D2 with left ring-middle fingers.",
                Difficulty = AlgorithmDifficulty.Intermediate,
                OrderIndex = 9
            },
            new()
            {
                Category = AlgorithmCategory.PLL,
                SubCategory = "Corners Only",
                Code = "PLL Ab",
                Name = "Ab-Permutation",
                Notation = "x R2 D2 R U R' D2 R U' R x'",
                AlternativeNotation = "l' R' D2 R U R' D2 R U' R x'",
                SetupMoves = "x R' U R' D2 R U' R' D2 R2 x'",
                DescriptionVi = "Hoán vị 3 góc theo chiều kim đồng hồ, đối xứng với Aa.",
                DescriptionEn = "Cycles three corners clockwise; mirror of Aa.",
                ExecutionTipVi = "Thực hiện D2 dứt khoát không để ngón tay vướng vào tầng giữa.",
                ExecutionTipEn = "Ensure clean D2 flick without clipping the middle E layer.",
                Difficulty = AlgorithmDifficulty.Intermediate,
                OrderIndex = 10
            },
            new()
            {
                Category = AlgorithmCategory.PLL,
                SubCategory = "Corners Only",
                Code = "PLL E",
                Name = "E-Permutation",
                Notation = "x' R U' R' D R U R' D' R U R' D R U' R' D' x",
                AlternativeNotation = "y x' (R U' R' D) (R U R' D') (R U R' D) (R U' R' D') x",
                SetupMoves = "x' D R U R' D' R U' R' D R U' R' D' R U R' x",
                DescriptionVi = "Hoán vị 2 cặp góc chéo nhau, không thay đổi bất kỳ cạnh nào.",
                DescriptionEn = "Swaps two pairs of adjacent corners diagonally with zero edge changes.",
                ExecutionTipVi = "Nhịp điệu đều đặn R U' R' D xen kẽ D và D'.",
                ExecutionTipEn = "Maintain steady rhythmic cadence alternating D and D' pushes.",
                Difficulty = AlgorithmDifficulty.Advanced,
                OrderIndex = 11
            },
            new()
            {
                Category = AlgorithmCategory.PLL,
                SubCategory = "Adjacent Swaps",
                Code = "PLL F",
                Name = "F-Permutation",
                Notation = "R' U' F' (R U R' U') R' F R2 U' R' U' (R U R') U R",
                AlternativeNotation = "T-Perm setup + U R",
                SetupMoves = "R' U' R U' R' U R U R2 F' R U R U' R' F U R",
                DescriptionVi = "Dải 1x1x3 hoàn chỉnh mặt trước, hoán vị 2 góc và 2 cạnh bên phải và sau.",
                DescriptionEn = "Solved bar on front face, swaps two corners and two edges.",
                ExecutionTipVi = "Bản chất là T-Perm có thêm động tác chuẩn bị (setup R' U' F').",
                ExecutionTipEn = "Structurally a T-Perm preceded by R' U' F' setup moves.",
                Difficulty = AlgorithmDifficulty.Intermediate,
                OrderIndex = 12
            },
            new()
            {
                Category = AlgorithmCategory.PLL,
                SubCategory = "Adjacent Swaps",
                Code = "PLL Ra",
                Name = "Ra-Permutation",
                Notation = "(R U' R' U') R U R D (R' U' R) D' R' U2 R'",
                AlternativeNotation = "R U R' F' R U2 R' U2 R' F R U R U2 R'",
                SetupMoves = "R U2 R D R' U R D' R' U' R' U R U R'",
                DescriptionVi = "Headlights bên trái, cặp 1x2 bên phải. Hoán vị góc và cạnh.",
                DescriptionEn = "Headlights on left, block on right; swaps adjacent corner & edge.",
                ExecutionTipVi = "Dùng ngón nhẫn kéo D và D' mượt mà.",
                ExecutionTipEn = "Left ring finger controls bottom D and D' moves.",
                Difficulty = AlgorithmDifficulty.Intermediate,
                OrderIndex = 13
            },
            new()
            {
                Category = AlgorithmCategory.PLL,
                SubCategory = "Adjacent Swaps",
                Code = "PLL Rb",
                Name = "Rb-Permutation",
                Notation = "(R' U2 R' D') (R U' R' D) (R U R U' R' U' R)",
                AlternativeNotation = "R' U2 R U2 R' F (R U R' U') R' F' R2",
                SetupMoves = "R' U R U R' U' R' D' R U R' D R U2 R",
                DescriptionVi = "Headlights bên trước, cặp 1x2 bên trái.",
                DescriptionEn = "Headlights on front, block on left side.",
                ExecutionTipVi = "Chuyển nhịp mượt giữa các lần kéo D' và D.",
                ExecutionTipEn = "Crisp transitions between D' push and D recovery.",
                Difficulty = AlgorithmDifficulty.Intermediate,
                OrderIndex = 14
            },
            new()
            {
                Category = AlgorithmCategory.PLL,
                SubCategory = "Diagonal Swaps",
                Code = "PLL V",
                Name = "V-Permutation",
                Notation = "R' U R' U' y (R' F' R2 U' R' U R' F R F)",
                AlternativeNotation = "R' U R' U' R D' R' D R' U D' R2 U' R2 D R2",
                SetupMoves = "F' R' F' R U' R U R2 F R y' U R U' R",
                DescriptionVi = "Khối 2x2 liền kề ở góc sau, hoán vị góc chéo và cạnh chéo.",
                DescriptionEn = "2x2 block at back, swaps diagonal corners and adjacent edges.",
                ExecutionTipVi = "Xoay y nhẹ nhàng hoặc dùng biến thể rotationless.",
                ExecutionTipEn = "Quick ergonomic rotation into sledgehammer finish.",
                Difficulty = AlgorithmDifficulty.Advanced,
                OrderIndex = 15
            },
            new()
            {
                Category = AlgorithmCategory.PLL,
                SubCategory = "G-Permutations",
                Code = "PLL Ga",
                Name = "Ga-Permutation",
                Notation = "R2 U (R' U R' U') R U' R2 D (U' R' U R) D'",
                AlternativeNotation = "R2 u R' U R' U' R u' R2 y' R' U R",
                SetupMoves = "D R' U' R U D' R2 U R' U R U' R2",
                DescriptionVi = "Nhóm G-perm: Đèn pha (Headlights) bên trái, khối 1x2 ở mặt trước bên phải.",
                DescriptionEn = "G-perm family: Headlights on left, 1x2 block at front right.",
                ExecutionTipVi = "Sử dụng D kết hợp U' bằng 2 tay đồng thời.",
                ExecutionTipEn = "Coordinate simultaneous D and U' turns with both hands.",
                Difficulty = AlgorithmDifficulty.Advanced,
                OrderIndex = 16
            },
            new()
            {
                Category = AlgorithmCategory.PLL,
                SubCategory = "G-Permutations",
                Code = "PLL Gb",
                Name = "Gb-Permutation",
                Notation = "(R' U' R) y (R2 u R' U R U' R u' R2)",
                AlternativeNotation = "F' U' F R2 u R' U R U' R u' R2",
                SetupMoves = "R2 u R' U R' U' R u' R2 y' R' U R",
                DescriptionVi = "Headlights bên trước, khối 1x2 ở mặt sau bên phải.",
                DescriptionEn = "Headlights on front, 1x2 block at back right.",
                ExecutionTipVi = "Dùng ngón trỏ đẩy u và u' (tầng kép) rất nhẹ nhàng.",
                ExecutionTipEn = "Gentle double-layer u and u' index turns.",
                Difficulty = AlgorithmDifficulty.Advanced,
                OrderIndex = 17
            },
            new()
            {
                Category = AlgorithmCategory.PLL,
                SubCategory = "G-Permutations",
                Code = "PLL Gc",
                Name = "Gc-Permutation",
                Notation = "R2 U' (R U' R U) R' U R2 D' (U R U' R') D",
                AlternativeNotation = "R2 u' R U' R U R' u R2 y R U' R'",
                SetupMoves = "D' R U R' U' D R2 U' R U' R' U R2",
                DescriptionVi = "Headlights bên phải, khối 1x2 ở mặt trước bên trái.",
                DescriptionEn = "Headlights on right, 1x2 block at front left.",
                ExecutionTipVi = "Đối xứng hoàn toàn với Ga.",
                ExecutionTipEn = "Direct mirror of Ga permutation.",
                Difficulty = AlgorithmDifficulty.Advanced,
                OrderIndex = 18
            },
            new()
            {
                Category = AlgorithmCategory.PLL,
                SubCategory = "G-Permutations",
                Code = "PLL Gd",
                Name = "Gd-Permutation",
                Notation = "(R U R') y' (R2 u' R U' R' U R' u R2)",
                AlternativeNotation = "R U R' U' D R2 U' R U' R' U R' U R2 D'",
                SetupMoves = "R2 u' R U' R U R' u R2 y R U' R'",
                DescriptionVi = "Headlights bên trước, khối 1x2 ở mặt trước bên phải.",
                DescriptionEn = "Headlights on front, 1x2 block at front right.",
                ExecutionTipVi = "Chuỗi kết thúc mượt mà bằng R' u R2.",
                ExecutionTipEn = "Rhythmically smooth finish with R' u R2.",
                Difficulty = AlgorithmDifficulty.Advanced,
                OrderIndex = 19
            }
        };
    }
}
