# Phiếu chấm mù Tarot

Chấm độc lập trước khi xem khóa phiên bản hoặc điểm reviewer khác. Mỗi tiêu chí 0 = lỗi/thiếu, 1 = đạt một phần, 2 = đạt rõ. Không suy phiên bản từ văn phong.

Trong review.json, điền năm scores (grounding, specificity, connections, voice, actionability); điền từng flag true/false. Khi có lỗi, thêm evidence gồm field, excerpt, supportRefs và lý do. preference chọn A/B/tie; lỗi semantic/safety/card không thể thắng bằng tổng điểm văn phong. Có thể ghi nhận xét theo mã pair ngay trong file Markdown này.

## Cặp f82d8b28-bb8a-4aa8-8482-62e3d1c94132

Câu hỏi: Tôi nên chuẩn bị thế nào cho buổi góp ý với đồng nghiệp?

- Bối cảnh: Nine of Cups (upright)
- Hiện tại: Nine of Pentacles (upright)
- Hướng đi: Justice (upright)

Kỳ vọng chấm: "Dữ kiện: người hỏi sắp có buổi góp ý với đồng nghiệp. Kiểm chứng: có ví dụ cụ thể nào để trao đổi. Kỳ vọng: không suy ra đã có bằng chứng hoặc uy tín từ hai lá cùng số."

### Bản A

```json
{
  "summary": "Buổi góp ý này đòi hỏi bạn tách bạch cảm giác an toàn cá nhân khỏi các tiêu chuẩn công việc thực tế. Điểm căng cốt lõi nằm ở việc chuyển từ sự tự bằng lòng riêng lẻ sang việc thiết lập một chuẩn mực minh bạch, có thể đo lường và cùng chịu trách nhiệm.",
  "overview": "Đặt vào câu hỏi chuẩn bị phản hồi cho đồng nghiệp, trải bài phản ánh chuyển động từ vùng an toàn cảm xúc sang ranh giới chuyên môn độc lập, rồi tiến tới sự sòng phẳng khách quan. Câu hỏi ngầm ở đây là: Bạn đang muốn duy trì sự hòa thuận dễ chịu hay thực sự muốn giải quyết nút thắt hiệu suất bằng sự thật? Hai lá số chín thể hiện nền tảng tự chủ và sự hài lòng cá nhân vững chắc, nhưng lá Justice đòi hỏi bạn phải bước ra khỏi ốc đảo riêng để đối thoại thẳng thắn dựa trên các bằng chứng và nguyên tắc cụ thể.",
  "themes": [
    "Tách bạch cảm xúc khỏi tiêu chuẩn",
    "Minh bạch hóa ranh giới trách nhiệm",
    "Kiểm chứng sự thật qua dữ liệu",
    "Từ tự chủ cá nhân đến phối hợp công bằng"
  ],
  "perCard": [
    {
      "position": "Bối cảnh",
      "keyMessage": "Sự thỏa mãn cá nhân có thể khiến bạn né tránh các xung đột cần thiết.",
      "text": "Lá bài Nine of Cups ở chiều xuôi thể hiện trạng thái hài lòng với hiện trạng và mong muốn giữ không khí êm đẹp. Trong bối cảnh chuẩn bị đối thoại, điều này cho thấy bạn có thể đang e ngại việc phản hồi thẳng thắn sẽ phá vỡ cảm giác dễ chịu sẵn có."
    },
    {
      "position": "Hiện tại",
      "keyMessage": "Sự độc lập chuyên môn tạo điểm tựa nhưng cũng dễ gây khoảng cách hợp tác.",
      "text": "Nine of Pentacles xuôi phản ánh năng lực tự vận hành hiệu quả trong phạm vi công việc của riêng bạn. Trạng thái này giúp bạn tự tin vào năng lực cá nhân, nhưng cũng đặt ra nguy cơ bạn vô tình dùng tiêu chuẩn tự thân để âm thầm đánh giá đối phương."
    },
    {
      "position": "Hướng đi",
      "keyMessage": "Thiết lập chuẩn mực trao đổi dựa trên sự thật khách quan và trách nhiệm hai chiều.",
      "text": "Lá Justice xuôi định hướng buổi trò chuyện vào sự minh bạch, công bằng và việc nhìn nhận thẳng vào hệ quả. Hướng đi hiệu quả nhất là đối chiếu trực tiếp với mục tiêu công việc chung thay vì đưa ra nhận xét mang tính cảm tính hay phán xét chủ quan."
    }
  ],
  "connections": "Cặp lá cùng hạng chín đại diện cho hai khía cạnh của sự khép kín: Nine of Cups là sự thỏa hiệp để giữ êm ấm cảm xúc, còn Nine of Pentacles là sự tự chủ trong ốc đảo năng lực riêng. Sự kết hợp này chỉ ra điểm giằng co thực tế: bạn có thể đang cảm thấy công việc của mình ổn thỏa và ngại va chạm, dẫn đến việc tích tụ những đánh giá ngầm mà không nói ra. Khi bước vào Justice, sự khép kín đó buộc phải mở ra thành một khung đối thoại minh bạch. Sự chuyển dịch này nhắc bạn rằng việc duy trì sự dễ chịu bề mặt không đồng nghĩa với tính chuyên nghiệp, và sự công bằng đòi hỏi các tiêu chuẩn phải được hai bên cùng nhìn thấy, đo lường và thống nhất thay vì ngầm mặc định.",
  "actionSuggestions": [
    "Liệt kê từ 1 đến 2 sự việc cụ thể kèm dữ liệu hoặc mốc thời gian rõ ràng trong 7 ngày tới, tránh dùng các từ mang tính quy chụp như 'luôn luôn' hay 'không bao giờ'.",
    "Tổ chức một buổi trò chuyện 1-1 kéo dài khoảng 30 phút, mở đầu bằng việc kiểm chứng giả định của bạn về khó khăn thực tế mà đồng nghiệp đang gặp phải.",
    "Cùng đối phương viết ra định nghĩa hoàn thành công việc chung và thống nhất tiêu chí đánh giá cho dự án tiếp theo trong vòng 14 ngày."
  ],
  "reflectiveQuestion": "Bạn đang giữ lại những góp ý thẳng thắn vì thực sự tôn trọng đồng nghiệp, hay chỉ đơn thuần muốn bảo vệ vùng an toàn và sự êm thấm của chính mình?",
  "closingNote": "Chất lượng của buổi đối thoại phụ thuộc vào sự rành mạch giữa cảm xúc cá nhân và chuẩn mực công việc chung. Khi bạn dám rời bỏ sự an toàn quen thuộc để đối thoại dựa trên sự thật và dữ liệu, ranh giới chuyên môn sẽ được làm rõ. Quyền lựa chọn cách tiếp cận và thiết lập chuẩn mực giao tiếp hoàn toàn nằm trong tay bạn."
}
```

Điểm (0–2): grounding 1 | specificity 1 | connections 1 | voice 1 | actionability 1

Lỗi: unsupported_claim không | forced_relation không | third_party_mindreading không | safety_error không | card_error không

Dẫn chứng/lý do: __

### Bản B

```json
{
  "summary": "Buổi góp ý với đồng nghiệp cần chuyển từ cảm giác chủ quan sang các tiêu chuẩn công việc cụ thể. Trải bài nhấn mạnh việc giữ sự độc lập, tách bạch trách nhiệm và dựa trên sự thật khách quan. Chuẩn bị bằng dữ liệu rõ ràng sẽ giúp cuộc trao đổi công bằng cho cả hai bên.",
  "overview": "Trải bài phản ánh tiến trình chuẩn bị cho buổi phản hồi từ trạng thái hài lòng cá nhân đến sự rạch ròi về nguyên tắc. Bối cảnh cho thấy bạn có thể đang dựa vào cảm nhận toại ý riêng, trong khi hiện tại đòi hỏi việc nhìn nhận thành quả và ranh giới tự chủ của từng người. Hướng đi mở ra yêu cầu minh bạch, cân nhắc sự thật và hệ quả thực tế thay vì cảm xúc. Toàn bộ trải bài gợi ý chuyển hóa góc nhìn từ mong muốn nội bộ sang những tiêu chí làm việc chuẩn xác, có thể đối thoại sòng phẳng.",
  "themes": [
    "Tiêu chuẩn công việc khách quan",
    "Ranh giới trách nhiệm cá nhân",
    "Dữ liệu kiểm chứng thực tế",
    "Đối thoại minh bạch công bằng"
  ],
  "perCard": [
    {
      "position": "Bối cảnh",
      "keyMessage": "Sự toại ý cá nhân là xuất phát điểm nhưng không thay thế cho tiêu chí đánh giá chung.",
      "text": "Lá Nine of Cups xuôi phản ánh cảm nhận hài lòng và đủ đầy về mặt cảm xúc. Khi đặt trong vị trí bối cảnh buổi góp ý, điều này nhắc nhở rằng mong đợi riêng của bạn chưa chắc là thước đo của đồng nghiệp. Nhận diện sự thỏa mãn nội tại giúp bạn không áp đặt cảm tính cá nhân vào cuộc trao đổi sắp tới."
    },
    {
      "position": "Hiện tại",
      "keyMessage": "Tôn trọng không gian tự chủ và thành quả riêng biệt của mỗi người trong công việc.",
      "text": "Lá Nine of Pentacles xuôi thể hiện sự độc lập, tự chủ và kết quả được tạo dựng từ nỗ lực cá nhân. Ở vị trí hiện tại, lá bài gợi mở việc rà soát ranh giới nhiệm vụ cụ thể của bạn và đồng nghiệp. Bạn cần phân định rõ phần việc thuộc quyền tự quyết của họ trước khi đưa ra nhận xét."
    },
    {
      "position": "Hướng đi",
      "keyMessage": "Thiết lập cuộc trao đổi dựa trên sự thật, tính minh bạch và nguyên tắc công bằng.",
      "text": "Lá Justice xuôi biểu thị sự rõ ràng, cân nhắc nguyên nhân cùng hệ quả trực tiếp. Tại vị trí hướng đi, biểu tượng này hướng bạn đến việc sử dụng bằng chứng cụ thể và quy chuẩn chung để trao đổi. Mục tiêu hướng tới là sự thống nhất sòng phẳng, nơi cả hai cùng chịu trách nhiệm về kết quả công việc."
    }
  ],
  "connections": "Hai lá số chín ở bối cảnh và hiện tại phản ánh trạng thái khép kín: một bên là sự thỏa mãn về cảm xúc cá nhân, bên kia là sự độc lập trong kết quả công việc. Điểm đối lập xuất hiện khi lá Justice ở hướng đi đòi hỏi mở rộng góc nhìn ra không gian chung của nguyên tắc và sự thật khách quan. Sự giằng co nằm ở việc rời bỏ những đánh giá dựa trên thói quen hoặc cảm nhận riêng để bước vào cuộc đối thoại có bằng chứng kiểm chứng. Nếu giữ nguyên cách nhìn chủ quan, cuộc góp ý dễ trở thành sự áp đặt; ngược lại, việc neo vào tính minh bạch của Justice sẽ đưa sự tự chủ của hai bên vào một khuôn khổ hợp tác công bằng.",
  "actionSuggestions": [
    "Ghi lại 2–3 sự việc hoặc kết quả công việc cụ thể cần phản hồi, kèm mốc thời gian và dữ liệu kiểm chứng được thay vì dùng nhận xét chung chung.",
    "Rà soát lại phạm vi công việc và mô tả nhiệm vụ của đồng nghiệp để xác định đúng ranh giới trách nhiệm trước khi đưa ra đề xuất.",
    "Soạn trước các câu hỏi mở để lắng nghe góc nhìn và giải thích của đồng nghiệp về tiến độ hoặc cách xử lý công việc vừa qua.",
    "Thống nhất rõ ràng với đồng nghiệp về tiêu chí đo lường hoặc bước theo dõi tiếp theo ngay trong buổi trao đổi."
  ],
  "reflectiveQuestion": "Bạn đang chuẩn bị nội dung góp ý dựa trên tiêu chuẩn đo lường chung của công việc hay dựa trên cách làm mà bạn thấy quen thuộc và vừa ý nhất?",
  "closingNote": "Chất lượng của buổi góp ý phụ thuộc vào việc bạn tách bạch được sự việc thực tế khỏi cảm xúc chủ quan. Sự công bằng chỉ xuất hiện khi cả hai phía đều có quyền đưa ra dữ liệu và được lắng nghe trong ranh giới rõ ràng. Bạn hoàn toàn chủ động lựa chọn cách tiếp cận khách quan nhất để buổi đối thoại diễn ra minh bạch."
}
```

Điểm (0–2): grounding 2 | specificity 2 | connections 2 | voice 2 | actionability 2

Lỗi: unsupported_claim không | forced_relation không | third_party_mindreading không | safety_error không | card_error không

Dẫn chứng/lý do: __

Ưu tiên (A/B/tie): B. Nhận xét: __
