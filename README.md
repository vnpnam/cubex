# CUBEX – The Art of Speedcubing 🧊⚡

**CUBEX** là nền tảng đào tạo, học tập và luyện tập Speedcubing (Rubik 3x3) chuyên nghiệp và toàn diện nhất. Kết hợp giữa thiết kế tinh tế đẳng cấp Apple, hiệu ứng tương tác 3D chân thực chuẩn Lusion và giao diện dashboard quản lý hiện đại như Linear.

---

## 🌟 TÍNH NĂNG NỔI BẬT (CORE CAPABILITIES)

### 1. 🎛️ Bấm Giờ Speedcubing Chuẩn WCA (Rubik Timer)
- **Cơ chế Spacebar & Touch Hold**: Đổi trạng thái trực quan Đỏ (Giữ) ➔ Xanh Neon (Sẵn sàng) ➔ Bắt đầu tính giờ.
- **WCA 15-Second Inspection**: Đếm ngược 15 giây với cảnh báo thị giác ở giây thứ 8 và 12; tự động tính phạt `+2s` (15s–17s) và `DNF` (>17s).
- **Bộ tạo thế cờ xáo trộn (WCA Scramble Generator)**:
  - 3x3x3 WCA chuẩn (20–25 moves, loại bỏ xung đột các mặt đối diện).
  - Cross practice scrambles.
  - F2L drill scrambles.
  - OLL & PLL practice setups.
- **Mô phỏng 2D Scramble Net**: Hiển thị lưới trải phẳng 6 mặt (U, L, F, R, B, D) theo màu chuẩn của khối sau xáo trộn.
- **Thống kê phiên giải theo thời gian thực**: Ao5 (Average of 5), Ao12 (Average of 12), Best Single (PB), Session Mean, quản lý hình phạt `+2` / `DNF`, xóa lần giải và ghi chú.

### 2. 🧊 Mô Phỏng 3D Siêu Thực (Lusion-Inspired Three.js Engine)
- **26 Cubies độc lập**: Thiết kế góc vát (beveled), chất liệu nhựa bóng cao cấp với ánh sáng studio và dải sáng viền Cyber Cyan.
- **Xoay chuyển mượt mà**: Hỗ trợ đầy đủ các lớp `U, D, L, R, F, B, M, E, S` và xoay khối `x, y, z`.
- **Bộ điều khiển thuật toán (Algorithm Player)**:
  - Tự động chạy (Auto-Play) & Tạm dừng.
  - Bước tới (Step Forward) / Bước lùi (Step Backward).
  - Điều chỉnh tốc độ `0.5x`, `1.0x`, `2.0x`.
  - Phím tắt trực tiếp trên bàn phím (`U, D, L, R, F, B` kết hợp `Shift` cho dấu `'`).
  - Thanh hiển thị bước xoay nổi bật (Floating active move indicator).
- **Mẫu thuật toán có sẵn**: T-Perm, Y-Perm, Sune, Sexy Move, Sledgehammer, Superflip, Checkerboard, Cube in a Cube.

### 3. 📚 Thư Viện Thuật Toán & Kỹ Thuật CFOP Hoàn Chỉnh
- **Beginner Method**: 6 bước nền tảng kèm giải thích chi tiết, thao tác ngón (Daisy, White Cross, First Layer Corners, Second Layer Edges, Yellow Cross, Yellow Face Corners).
- **Cross Training**: 4-8 bước tối ưu, lập kế hoạch trong 15s quan sát, kỹ thuật Color Neutrality (trắng/vàng).
- **CFOP Suite**:
  - **F2L (41 thế cờ)**: Easy Inserts, Corner & Edge in U layer, White facing up, Corner in slot.
  - **OLL (57 thế cờ & 2-Look OLL)**: T-Shapes, Dot cases, Cross H-shape, Pi-shape, Knight move.
  - **PLL (21 hoán vị)**: Đầy đủ T-Perm, Y-Perm, Ua, Ub, H, Z, Jb, Ja, Aa, Ab, E, F, Ra, Rb, V, Ga, Gb, Gc, Gd.
- **Modal Luyện Tập 3D**: Xem mô phỏng khối xoay theo thuật toán, phân tích Fingertrick trigger, đo tốc độ drill (PB Drill), đánh dấu trạng thái (Đang Học, Đang Luyện, Đã Thành Thục).

### 4. 📊 Bảng Thống Kê & Phân Tích Hiệu Năng (Linear-Style Analytics)
- **Biểu đồ tiến trình thời gian (Timeline Progression)**: Recharts biểu diễn thời gian từng lần giải kết hợp đường trung bình rolling Ao5 và Ao12.
- **Biểu đồ phân bổ tốc độ (Distribution Histogram)**: Chia khoảng `<11s`, `11-12s`, `12-13s`, `13-14s`, `14-16s`, `16s+`.
- **Ma trận làm chủ CFOP (Mastery Matrix)**: Tỷ lệ % hoàn thành và số lượng thuật toán đã Mastered theo từng phân loại Beginner, Cross, F2L, OLL, PLL.

### 5. 🛡️ Quản Trị CMS & Phân Quyền (RBAC)
- **Role-based Access Control**: Phân quyền chặt chẽ giữa Quản trị viên (`Admin`) và Thành viên Speedcuber (`Cubist`).
- **Quản lý thuật toán**: Thêm mới thuật toán, chỉnh sửa công thức, notation, mô tả song ngữ Việt/Anh, mẹo fingertrick, xóa thuật toán.
- **Danh bạ Speedcuber**: Quản lý thành viên, WCA ID, số lần giải và phân quyền.

### 6. 🌐 Đa Ngôn Ngữ Song Ngữ (Vietnamese / English)
- Hỗ trợ chuyển đổi 1-click tức thì giữa Tiếng Việt và English cho 100% giao diện, thuật toán và hướng dẫn.

---

## 🛠️ KIẾN TRÚC KỸ THUẬT (TECH STACK)

### Frontend
- **Framework**: Next.js 16 (App Router) với React 19 & TypeScript
- **Styling**: Tailwind CSS với hệ màu Obsidian Dark Theme cao cấp
- **3D Graphics Engine**: Three.js với Studio Lighting, ACESFilmic ToneMapping, PCFSoftShadowMap
- **Cube Logic & Notation**: cubing.js & custom high-performance WCA notation parser
- **State Management**: Zustand
- **Data Fetching**: TanStack Query v5 & Custom API Client với graceful fallback
- **Data Visualization**: Recharts
- **Icons & Effects**: Lucide React & Canvas Confetti

### Backend
- **Platform**: ASP.NET Core Web API trên **.NET 10**
- **ORM & Data**: Entity Framework Core 10 (Hỗ trợ SQL Server & SQLite Dev Fallback)
- **Authentication**: ASP.NET Core Identity & JWT Bearer Token với Claims & Roles
- **Documentation**: OpenAPI / Swagger UI
- **Architecture**: Clean Architecture chia tầng (Controllers, Entities, DTOs, Services, Data)

---

## 🚀 HƯỚNG DẪN KHỞI CHẠY (QUICK START)

### 1. Khởi động Backend API (.NET 10)
```bash
cd backend/Cubex.Api
dotnet run
```
- API sẽ chạy tại: `http://localhost:5000` (hoặc `https://localhost:5001`)
- OpenAPI / Swagger UI: `http://localhost:5000/openapi/v1.json`

### 2. Khởi động Frontend (Next.js)
```bash
cd frontend
npm run dev
```
- Mở trình duyệt tại: `http://localhost:3000`

### 3. Tài Khoản Mặc Định Đã Seed Sẵn
- **Admin**: `admin@cubex.com` / `CubexAdmin2026!` (Đầy đủ quyền CMS & quản lý)
- **Speedcuber**: `cubist@cubex.com` / `CubexPro2026!` (Sub-12 solver có sẵn lịch sử giải và tiến độ học)
- *Có sẵn nút "1-Click Demo" và "1-Click Admin" trong popup Đăng nhập để kiểm tra ngay lập tức!*

---

## ⌨️ BẢNG PHÍM TẮT TIỆN ÍCH (SHORTCUTS)
- `SPACE`: Nhấn giữ 0.5s để chuẩn bị ➔ Thả để bắt đầu bấm giờ ➔ Nhấn bất kỳ phím nào để dừng.
- `U, D, L, R, F, B, M`: Xoay trực tiếp các mặt tương ứng trên mô phỏng 3D.
- `SHIFT + Phím`: Xoay nghịch đảo (ví dụ `Shift + R` = `R'`).
