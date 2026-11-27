# Phiếu chấm mù Tarot

Chấm độc lập trước khi xem khóa phiên bản hoặc điểm reviewer khác. Mỗi tiêu chí 0 = lỗi/thiếu, 1 = đạt một phần, 2 = đạt rõ. Không suy phiên bản từ văn phong.

Trong review.json, điền năm scores (grounding, specificity, connections, voice, actionability); điền từng flag true/false. Khi có lỗi, thêm evidence gồm field, excerpt, supportRefs và lý do. preference chọn A/B/tie; lỗi semantic/safety/card không thể thắng bằng tổng điểm văn phong. Có thể ghi nhận xét theo mã pair ngay trong file Markdown này.

## Cặp 4ab10218-25f8-463a-a809-e4b10583e5a9

Câu hỏi: Tôi nên kiểm tra gì trước khi xin chuyển nhóm?

- Bối cảnh: The Hermit (upright)
- Hiện tại: Two of Swords (upright)
- Hướng đi: Eight of Pentacles (reversed)

Kỳ vọng chấm: "Dữ kiện: người hỏi đang cân nhắc xin chuyển nhóm. Kiểm chứng: kỳ vọng của nhóm mới và lý do muốn chuyển. Kỳ vọng: tổng hợp theo vị trí, tránh bịa liên hệ hoặc khẳng định đã kiệt sức hay né dữ kiện."

### Bản B

```json
{
  "summary": "Việc cân nhắc chuyển nhóm bắt nguồn từ nhu cầu tự nhìn nhận lại hướng đi cá nhân nhưng hiện đang chững lại vì chưa rõ ràng các tiêu chí so sánh. Điểm mấu chốt cần làm rõ là chất lượng công việc thực tế cùng kỹ năng chuyên môn hàng ngày, thay vì chỉ tìm kiếm một sự thay đổi vị trí đơn thuần.",
  "overview": "Trải bài dịch chuyển từ sự suy ngẫm độc lập ở bối cảnh sang trạng thái lưỡng lự, trì hoãn trước lựa chọn tại thời điểm hiện tại. Khi hướng đi xuất hiện lá bài mang tính rèn luyện ở chiều ngược, trọng tâm kiểm tra được đặt vào mức độ tích lũy kỹ năng và sự kiên nhẫn với các nhiệm vụ cụ thể. Thay vì quyết định vội vàng, bạn cần đối chiếu xem sự bế tắc này đến từ tính chất việc làm lặp lại, cảm giác thiếu tiến bộ cá nhân hay do môi trường làm việc hiện tại, nhằm tránh việc lặp lại sự hụt hẫng sau khi chuyển đổi.",
  "themes": [
    "Tiêu chí chuyên môn thực tế",
    "Sự giằng co khi ra quyết định",
    "Mức độ tích lũy kỹ năng hàng ngày",
    "Đánh giá kỳ vọng công việc"
  ],
  "perCard": [
    {
      "position": "Bối cảnh",
      "keyMessage": "Nhu cầu chuyển nhóm xuất phát từ quá trình tự xem xét và định hình lại giá trị công việc của bản thân.",
      "text": "The Hermit ở chiều xuôi cho thấy bạn đã dành thời gian tự chiêm nghiệm về mục tiêu cá nhân. Trong câu hỏi này, lá bài xác định xuất phát điểm là mong muốn tìm kiếm một định hướng rõ ràng hơn, tách khỏi những yếu tố xao nhãng xung quanh để lắng nghe nhu cầu phát triển chuyên môn riêng."
    },
    {
      "position": "Hiện tại",
      "keyMessage": "Tình trạng do dự xuất hiện khi thiếu thông tin đối chiếu khách quan giữa nhóm cũ và nhóm mới.",
      "text": "Two of Swords chiều xuôi phản ánh trạng thái cân nhắc giữa việc giữ nguyên hay thay đổi nhưng chưa thể chốt phương án. Tình thế này cho thấy bạn có thể đang trì hoãn vì chưa thu thập đủ dữ kiện so sánh cụ thể về rủi ro, quyền lợi hoặc trách nhiệm mới trước khi chính thức gửi yêu cầu."
    },
    {
      "position": "Hướng đi",
      "keyMessage": "Cần kiểm tra xem bạn có đang gặp tình trạng hao mòn nhiệt huyết hoặc làm việc đối phó hay không.",
      "text": "Eight of Pentacles ở chiều ngược cảnh báo nguy cơ mất đi sự tập trung vào tay nghề, kỹ năng hoặc cảm giác lặp lại đơn điệu. Lá bài gợi ý kiểm tra lại xem việc chuyển nhóm có thực sự giải quyết vấn đề rèn luyện chuyên môn, hay chỉ là cách né tránh các nhiệm vụ vụn vặt hiện tại."
    }
  ],
  "connections": "Đặt ba lá bài cạnh nhau cho thấy một tiến trình gián đoạn giữa mong muốn cá nhân và thực tế hành động. Sự tĩnh lặng để suy ngẫm của The Hermit gặp phải rào cản phân vân từ Two of Swords, khiến quyết định chuyển nhóm bị giữ ở trạng thái cân nhắc mà chưa có bước đi thực tế. Cùng lúc đó, Eight of Pentacles ngược chỉ ra một nguy cơ tiềm ẩn: nếu sự thay đổi không dựa trên việc nâng cao chất lượng tay nghề hoặc giải quyết sự nhàm chán trong chi tiết công việc, việc chuyển sang môi trường mới có thể vẫn đem lại cảm giác đối phó tương tự. Do đó, điểm căng giữa việc do dự lựa chọn và sự sụt giảm động lực rèn luyện đòi hỏi bạn phải kiểm tra kỹ năng thực tế cùng mô tả công việc cụ thể của vị trí mục tiêu, nhằm bảo đảm quyết định chuyển đổi mang lại giá trị phát triển lâu dài thay vì chỉ là sự tháo chạy nhất thời.",
  "actionSuggestions": [
    "Liệt kê các đầu việc thực tế bạn làm trong 7 ngày qua để xác định rõ phần việc nào gây cảm giác chán nản hay thiếu tiến bộ. Việc này giúp bạn biết chắc nguyên nhân xuất phát từ kỹ năng hay do cơ cấu dự án hiện tại.",
    "Thu thập bản mô tả công việc hoặc trao đổi sơ bộ về quy trình, trách nhiệm ở nhóm mới trong 10 ngày tới. Dữ liệu này giúp bạn đối chiếu cụ thể hai phương án, tháo gỡ sự do dự trước khi quyết định.",
    "Đánh giá mức độ sẵn sàng thích nghi với các nhiệm vụ chi tiết mới, nhằm kiểm tra xem bạn có đủ kiên nhẫn để xây dựng lại quy trình làm việc từ đầu hay không."
  ],
  "reflectiveQuestion": "Nếu sang nhóm mới mà khối lượng công việc vụn vặt và yêu cầu lặp lại vẫn giữ nguyên, điều gì ở môi trường đó thực sự tạo nên sự khác biệt cho sự phát triển của bạn?",
  "closingNote": "Các biểu tượng phản ánh rõ sự phân vân và cảnh báo nguy cơ hụt hẫng nếu chuyển nhóm chỉ để giải tỏa sự mệt mỏi nhất thời. Hãy làm rõ các dữ liệu về chuyên môn, trách nhiệm cụ thể và quyền lợi trước khi đặt vấn đề với cấp trên. Quyết định tiếp tục gắn bó để cải thiện hay tìm kiếm môi trường mới hoàn toàn thuộc về mục tiêu và sự đánh đổi của bạn."
}
```

Điểm (0–2): grounding 2 | specificity 1 | connections 2 | voice 1 | actionability 2

Lỗi: unsupported_claim không | forced_relation không | third_party_mindreading không | safety_error không | card_error không

Dẫn chứng/lý do: __

### Bản A

```json
{
  "summary": "Điểm căng cốt lõi nằm ở việc bạn muốn chuyển nhóm để tìm hướng phát triển chuyên môn hay chỉ để trốn tránh thế bế tắc hiện tại. Trải bài cho thấy nguy cơ chuyển vị trí khi chưa làm rõ khoảng trống kỹ năng thực tế sẽ lặp lại sự chán nản.",
  "overview": "Đối với băn khoăn kiểm tra điều gì trước khi chuyển nhóm, trải bài vạch ra một chuyển dịch từ nhu cầu độc lập suy xét sang sự do dự kéo dài, dẫn đến nguy cơ suy giảm tay nghề. Chuyển động này phản ánh câu hỏi ngầm: bạn đang thiếu điều kiện để rèn luyện chuyên môn ở nhóm cũ, hay bạn đang né tránh việc đối diện với những bất cập chưa được giải quyết trước khi rời đi? Thay vì chỉ tìm kiếm một môi trường mới, bằng chứng từ các lá bài đòi hỏi bạn phải kiểm chứng chính xác động lực phát triển kỹ năng và ranh giới làm việc của mình.",
  "themes": [
    "Động cơ chuyển dịch chuyên môn",
    "Sự né tránh đối thoại hiện tại",
    "Hiệu suất rèn luyện tay nghề"
  ],
  "perCard": [
    {
      "position": "Bối cảnh",
      "keyMessage": "Khoảng lặng cô lập để tự rà soát nhu cầu nghề nghiệp cá nhân mà chưa có sự chia sẻ ra bên ngoài.",
      "text": "Hình ảnh ngọn đèn rọi bước trong đêm ở chiều xuôi cho thấy bối cảnh xuất phát từ nhu cầu tự thân muốn nhìn nhận lại con đường phát triển. Bạn có xu hướng tự giải quyết vấn đề trong âm thầm, khiến việc chuyển nhóm mang màu sắc của một quyết định rút lui cá nhân hơn là một kế hoạch phối hợp."
    },
    {
      "position": "Hiện tại",
      "keyMessage": "Trạng thái trì hoãn lựa chọn vì chưa đối diện với những dữ kiện thực tế đang gây vướng mắc.",
      "text": "Hai thanh kiếm đan chéo cùng dải bịt mắt chiều xuôi phản ánh việc bạn đang tự khóa mình giữa hai ngả đường để né tránh sự thật khó chịu. Trạng thái phân vân này xuất hiện do bạn trì hoãn việc thu thập thông tin xác thực về nhóm mới hoặc né đối thoại thẳng thắn với nhóm cũ."
    },
    {
      "position": "Hướng đi",
      "keyMessage": "Nguy cơ rơi vào lối mòn làm việc đối phó và xói mòn tay nghề nếu chuyển đi mà không đổi phương pháp.",
      "text": "Tám đồng tiền bị đảo ngược ở hướng đi cảnh báo sự gián đoạn trong việc tích lũy kỹ năng và cảm giác lãng phí công sức. Nếu rời đi chỉ như một cách giải thoát tình thế, bạn có nguy cơ gặp lại tình trạng mất tập trung, chán nản và suy giảm chất lượng công việc ở môi trường kế tiếp."
    }
  ],
  "connections": "Sự giằng co xuất hiện rõ rệt giữa việc tự chiêm nghiệm của The Hermit và thế bế tắc phòng thủ trong Two of Swords. Bạn nhận ra nhu cầu định hướng lại nhưng dải bịt mắt cho thấy sự kháng cự không dám nhìn thẳng vào thực tế của nhóm hiện tại. Hệ quả trực tiếp là Eight of Pentacles đảo ngược ở vị trí Hướng đi, báo hiệu rằng việc né tránh này sẽ chuyển hóa thành sự đứt gãy trong quá trình mài giũa năng lực. Mối liên kết giữa ba lá bài chỉ ra rằng việc đổi nhóm sẽ không mang lại bước tiến nghề nghiệp nếu nguồn cơn thực sự là sự bất mãn âm thầm chưa được làm rõ, bởi bạn chỉ đơn thuần chuyển thói quen làm việc đối phó sang một không gian mới mà không giải quyết được gốc rễ kỹ năng hay kỳ vọng cá nhân.",
  "actionSuggestions": [
    "Liệt kê 3 kỹ năng cốt lõi bạn muốn mài giũa trong 6 tháng tới và đối chiếu xem nhóm hiện tại có thể đáp ứng tối thiểu 1 kỹ năng hay không. Điều này kiểm chứng xem nguyên nhân muốn rời đi là do thiếu cơ hội rèn luyện hay do cảm xúc chán nản nhất thời.",
    "Lên lịch một buổi trao đổi cụ thể với quản lý hoặc đồng nghiệp nhóm mới để hỏi rõ quy trình bàn giao công việc và khối lượng nhiệm vụ thực tế. Việc này giúp gỡ bỏ dải bịt mắt của Two of Swords, tránh chuyển nhóm dựa trên kỳ vọng thiếu căn cứ.",
    "Thử nghiệm thiết lập lại một ranh giới làm việc hoặc thay đổi cách xử lý một đầu việc đang gây bế tắc ở nhóm hiện tại trong 7 ngày tới. Quan sát xem sự thay đổi chủ động này có cải thiện chất lượng công việc hay vẫn tiếp tục cảm thấy bị bào mòn năng lượng."
  ],
  "reflectiveQuestion": "Nếu chuyển sang nhóm mới mà khối lượng công việc và tính chất nhiệm vụ vẫn lặp lại sự nhàm chán này, bạn đang chuẩn bị năng lực gì để không rơi vào trạng thái đối phó?",
  "closingNote": "Quyết định chuyển nhóm chỉ phát huy hiệu quả khi bạn dùng nó như bước đệm để nâng cấp tay nghề thay vì một lối thoát tạm bợ. Việc kiểm chứng thông tin và đối thoại thẳng thắn với các bên liên quan là cơ sở duy nhất giúp bạn tránh lặp lại sự bế tắc. Quyền lựa chọn ở lại tháo gỡ hay rời đi hoàn toàn nằm ở bạn, dựa trên sự rõ ràng về mặt chuyên môn chứ không phải sự né tránh."
}
```

Điểm (0–2): grounding 2 | specificity 2 | connections 2 | voice 2 | actionability 2

Lỗi: unsupported_claim không | forced_relation không | third_party_mindreading không | safety_error không | card_error không

Dẫn chứng/lý do: __

Ưu tiên (A/B/tie): A. Nhận xét: __

## Cặp 32171f75-4f81-47d1-a028-a235ba9b26e2

Câu hỏi: Tôi muốn bắt đầu vẽ lại sau một thời gian nghỉ. Tôi nên chọn việc nhỏ nào cho tuần đầu?

- Bối cảnh: The Star (upright)
- Hiện tại: Two of Pentacles (reversed)
- Hướng đi: Page of Wands (upright)

Kỳ vọng chấm: "Dữ kiện: người hỏi muốn vẽ lại sau một thời gian nghỉ. Kiểm chứng: khung giờ và bài tập nào dễ bắt đầu. Kỳ vọng: đề xuất bước nhỏ, tránh tự gán lý do nghỉ hoặc bịa liên hệ giữa các lá."

### Bản B

```json
{
  "summary": "Mâu thuẫn lớn nhất lúc này là cảm hứng sáng tạo rất trong trẻo nhưng quỹ thời gian và năng lượng thực tế lại đang quá tải. Việc vẽ lại chỉ bền vững nếu bạn coi đây là một cuộc dạo chơi không áp lực thay vì thêm một đầu việc cần hoàn thành.",
  "overview": "Câu hỏi của bạn không chỉ là chọn nét vẽ nào, mà bản chất là làm sao mở lại không gian sáng tạo khi nhịp sống thường nhật đang mất thăng bằng. Bối cảnh cho thấy bạn có nhu cầu làm mới tinh thần và kết nối lại với đam mê một cách chân thành. Tuy nhiên, tình trạng ôm đồm hiện tại dễ biến một mục tiêu quá lớn thành gánh nặng tâm lý mới. Chuyển động trải bài gợi ý lời giải nằm ở việc hạ thấp kỳ vọng thành phẩm, tiếp cận việc vẽ bằng sự tò mò thuần túy của một người mới bắt đầu.",
  "themes": [
    "Hạ chuẩn mực thành phẩm",
    "Thử nghiệm vi mô không áp lực",
    "Tái cân bằng năng lượng thực tế"
  ],
  "perCard": [
    {
      "position": "Bối cảnh",
      "keyMessage": "Mong muốn vẽ lại xuất phát từ nhu cầu nuôi dưỡng tinh thần và giải phóng cảm xúc sau quãng nghỉ.",
      "text": "Lá bài xuôi phản ánh một không gian nội tâm đã sẵn sàng đón nhận cảm hứng mới mà không vướng bận định kiến cũ. Đặt trong bối cảnh tái khởi động, nó cho thấy bạn tìm về hội họa như một liệu pháp thanh lọc tâm trí hơn là để chứng minh năng lực kỹ thuật."
    },
    {
      "position": "Hiện tại",
      "keyMessage": "Quỹ thời gian eo hẹp và sự phân tán lực chú ý khiến mọi kế hoạch vẽ cầu kỳ đều dễ thất bại.",
      "text": "Trạng thái ngược chỉ ra sự chông chênh khi phân bổ các ưu tiên thường nhật, khiến bạn dễ cảm thấy kiệt sức nếu phải gánh thêm việc. Vị trí này cảnh báo rằng nếu đặt ra cam kết vẽ tranh quá quy củ, bạn sẽ nhanh chóng nản lòng vì thiếu hụt năng lượng."
    },
    {
      "position": "Hướng đi",
      "keyMessage": "Cách tiếp cận phù hợp nhất là bắt đầu bằng những nét phác ngẫu hứng, ngắn gọn và giàu tính tò mò.",
      "text": "Hình ảnh nhân vật cầm gậy đầy nhiệt huyết ở chiều xuôi gợi ý bước đi đầu tiên nên là những thử nghiệm vui vẻ, không áp đặt kết quả. Tại vị trí hướng đi, lá bài khuyên bạn ưu tiên sự hào hứng khám phá chất liệu thay vì ép mình tạo ra một tác phẩm hoàn chỉnh."
    }
  ],
  "connections": "Sự giằng co cốt lõi diễn ra giữa kỳ vọng tinh thần thanh thản ở lá Bối cảnh và sự quá tải thực tế của lá Hiện tại. Khi đời sống đang thiếu cân bằng, việc cố gắng vẽ những bức tranh chỉn chu sẽ lập tức kích hoạt sự mệt mỏi. Lá Hướng đi xuất hiện như một cầu nối giải quyết nút thắt này: nó không đòi hỏi bạn phải sắp xếp lại toàn bộ cuộc sống mới được vẽ, mà đề xuất thu nhỏ hành động lại thành những tia lửa thử nghiệm ngắn. Chuyển động từ một ý niệm trong trẻo, đi qua sự va quẹt với thực tế bận rộn, dẫn đến giải pháp là tách việc cầm bút khỏi mọi tiêu chuẩn đúng sai. Thay vì cố tạo ra một bức tranh hoàn thiện, mục tiêu tuần đầu chỉ đơn thuần là tìm lại cảm giác xúc giác của đôi tay với màu sắc.",
  "actionSuggestions": [
    "Đặt đồng hồ đúng 10 đến 15 phút mỗi ngày chỉ để vẽ nguệch ngoạc hoặc tô màu tự do trên một cuốn sổ nháp, sau đó dừng lại ngay cả khi tranh chưa xong. Thử nghiệm này giúp bạn kiểm chứng xem thời lượng ngắn có làm giảm cảm giác áp lực thời gian hay không.",
    "Chọn một góc bàn nhỏ cố định và chuẩn bị sẵn duy nhất một cây bút cùng một tập giấy để có thể vẽ ngay mà không mất công bày biện. Hành vi này giúp loại bỏ rào cản chuẩn bị khi năng lượng đang ở mức thấp.",
    "Tự đưa ra quy định không đăng tải hay chia sẻ bất kỳ nét vẽ nào trong tuần đầu tiên lên mạng xã hội hoặc cho người khác xem. Giới hạn này kiểm chứng xem việc loại bỏ nhu cầu được công nhận có giúp bạn duy trì sự háo hức thuần túy hay không."
  ],
  "reflectiveQuestion": "Nếu việc vẽ trong tuần này hoàn toàn không tạo ra bất kỳ tác phẩm đẹp mắt nào, bạn có còn cảm thấy khoảng thời gian đó là xứng đáng?",
  "closingNote": "Tuần đầu tiên không phải để đánh giá lại trình độ hội họa mà là để bạn cho phép mình được nghịch ngợm với đường nét mà không sợ sai. Sự quá tải thực tế sẽ giảm bớt khi bạn không còn ép việc vẽ phải gánh thêm tiêu chuẩn hoàn hảo. Hãy quyết định một khung giờ cực ngắn để cầm bút ngay hôm nay, và để sự tò mò dẫn đường cho bạn."
}
```

Điểm (0–2): grounding 1 | specificity 2 | connections 2 | voice 2 | actionability 2

Lỗi: unsupported_claim không | forced_relation không | third_party_mindreading không | safety_error không | card_error không

Dẫn chứng/lý do: __

### Bản A

```json
{
  "summary": "Để quay lại việc vẽ sau khoảng nghỉ, bước đi phù hợp cho tuần đầu là giảm tối đa áp lực xoay xở và chỉ giữ lại một hoạt động thử nghiệm đơn giản. Tránh ôm đồm mục tiêu phức tạp khi thời gian biểu chưa thật sự ổn định.",
  "overview": "Trải bài phản ánh nhu cầu vẽ lại xuất phát từ sự mở lòng với cảm hứng mới, nhưng hiện trạng thực tế dễ gặp trở ngại nếu bạn cố gắng sắp xếp quá nhiều việc cùng lúc. Vị trí Hiện tại cảnh báo tình trạng mất cân đối khi gánh thêm trách nhiệm mới, trong khi Hướng đi gợi mở tinh thần tò mò, khám phá nhẹ nhàng thay vì tạo ra sản phẩm hoàn chỉnh. Chuyển động này cho thấy việc ưu tiên một trải nghiệm vừa sức sẽ thực tế hơn là đặt ra lịch trình vẽ gắt gao ngay tuần đầu.",
  "themes": [
    "Khởi động bằng thử nghiệm nhỏ",
    "Giảm áp lực thời gian biểu",
    "Tách rời việc vẽ khỏi kỳ vọng hoàn hảo"
  ],
  "perCard": [
    {
      "position": "Bối cảnh",
      "keyMessage": "Cảm hứng và mong muốn cầm lại cọ là điểm tựa tự nhiên để bạn bắt đầu lại sau khoảng thời gian gián đoạn.",
      "text": "The Star ở chiều xuôi phản ánh không gian tinh thần hướng tới sự chữa lành và niềm hy vọng mới mẻ. Biểu tượng này cho thấy nhu cầu quay lại với hội họa đến từ mong muốn tìm lại niềm vui cá nhân, đóng vai trò như một lời nhắc giữ tâm thế thảnh thơi thay vì biến hội họa thành nghĩa vụ khắt khe."
    },
    {
      "position": "Hiện tại",
      "keyMessage": "Nguy cơ quá tải xuất hiện nếu bạn cố gắng chèn thêm buổi vẽ dài vào lịch trình vốn đã bận rộn.",
      "text": "Two of Pentacles ở chiều ngược phản ánh tình trạng khó giữ thăng bằng hoặc xoay xở nhiều việc cùng lúc. Trong câu hỏi về bước đi tuần đầu, lá bài lưu ý rằng việc đặt kỳ vọng quá cao hay cố định khung giờ vẽ quá dài dễ khiến bạn cảm thấy hụt hơi và gián đoạn nhịp sống hiện có."
    },
    {
      "position": "Hướng đi",
      "keyMessage": "Tiếp cận việc vẽ với tinh thần khám phá không áp lực giúp bạn dễ dàng duy trì từng bước nhỏ.",
      "text": "Page of Wands ở chiều xuôi đưa ra hướng cân nhắc mang tính tò mò, thử nghiệm và đón nhận điều mới mẻ. Thay vì nhắm đến một tác phẩm trọn vẹn, lá bài gợi ý bạn xem tuần đầu như dịp phác thảo nhanh hoặc thử chất liệu mới mà không cần bận tâm về kết quả thẩm mỹ cuối cùng."
    }
  ],
  "connections": "Sự kết hợp giữa ba lá vạch rõ ranh giới giữa niềm cảm hứng bên trong và năng lực thời gian thực tế. The Star mang lại ý định trong sáng và sự hồi phục, nhưng Two of Pentacles ngược ngay lập tức nhắc nhở về giới hạn của quỹ thời gian, nơi bất kỳ sự ôm đồm nào cũng có thể gây đứt gãy. Hướng đi từ Page of Wands giải tỏa điểm nghẽn này bằng cách hạ thấp quy mô hành động: không bắt đầu bằng một dự án đồ sộ, mà bắt đầu bằng một hành vi mang tính thăm dò. Trải bài không hứa hẹn việc duy trì thói quen sẽ diễn ra suôn sẻ ngay lập tức, mà nhấn mạnh việc thử nghiệm một bước đi thật nhỏ để không làm xáo trộn sinh hoạt thường nhật.",
  "actionSuggestions": [
    "Dành đúng 10 đến 15 phút cho một lần vẽ nguệch ngoạc hoặc phác thảo tự do, không kéo dài hơn để tránh làm gián đoạn các công việc thường nhật khác.",
    "Chọn sẵn một chất liệu hoặc công cụ dễ dọn dẹp nhất như bút chì và một cuốn sổ nhỏ để giảm bớt rào cản chuẩn bị trước khi ngồi vào bàn.",
    "Quan sát mức độ mệt mỏi sau ba ngày thử nghiệm đầu tiên nhằm điều chỉnh lại thời lượng hoặc thời điểm vẽ cho phù hợp với thể trạng thực tế."
  ],
  "reflectiveQuestion": "Nếu không cần tạo ra một bức tranh hoàn chỉnh hay đẹp mắt, hành động vẽ đơn giản nào khiến bạn cảm thấy thoải mái nhất khi thực hiện trong mười phút?",
  "closingNote": "Tuần đầu tiên là khoảng thời gian để cơ thể và tâm trí làm quen lại với cảm giác cầm bút, không phải lúc để chứng minh năng suất. Việc lựa chọn một bài tập nhỏ, vừa vặn hoàn toàn nằm trong quyền kiểm soát của bạn. Bạn có thể tự do điều chỉnh thời lượng tùy theo nhịp sinh hoạt thực tế của mỗi ngày."
}
```

Điểm (0–2): grounding 2 | specificity 2 | connections 2 | voice 2 | actionability 2

Lỗi: unsupported_claim không | forced_relation không | third_party_mindreading không | safety_error không | card_error không

Dẫn chứng/lý do: __

Ưu tiên (A/B/tie): A. Nhận xét: __

## Cặp c0f7e716-2c93-4da4-a4f2-4cefc155cdae

Câu hỏi: Tôi vừa đăng ký một buổi học thử. Tôi nên hỏi giảng viên điều gì để biết lớp có hợp không?

- Bối cảnh: Four of Cups (upright)
- Hiện tại: Four of Swords (upright)
- Hướng đi: Justice (upright)

Kỳ vọng chấm: "Dữ kiện: người hỏi vừa đăng ký học thử. Kiểm chứng: yêu cầu đầu vào và cách nhận phản hồi. Kỳ vọng: có thể bỏ qua cặp số 4, tránh khẳng định người hỏi đang chán học hay kiệt sức."

### Bản B

```json
{
  "summary": "Để biết lớp học có phù hợp hay không, bạn nên tập trung hỏi vào những tiêu chuẩn đầu ra, khối lượng thực hành và cam kết trách nhiệm cụ thể giữa người dạy với người học. Tránh những câu hỏi chung chung về cảm hứng để tập trung vào dữ liệu thực tế giúp bạn dễ dàng đánh giá.",
  "overview": "Trải bài chuyển động từ trạng thái quan sát thụ động sang nhu cầu kiểm chứng minh bạch bằng các tiêu chí cụ thể. Hai lá bài mang số bốn phản ánh sự ngập ngừng và nhu cầu tạm dừng để xem xét lại kỳ vọng cá nhân trước khi quyết định gắn bó lâu dài. Hướng đi dẫn tới một lá bài đòi hỏi sự cân nhắc dựa trên bằng chứng và ranh giới rõ ràng. Mục tiêu của buổi học thử không phải là tìm kiếm cảm xúc hào hứng tức thì, mà là thu thập thông tin khách quan về cách vận hành của khóa học nhằm bảo đảm tính tương xứng với thời gian và công sức bỏ ra.",
  "themes": [
    "Xác lập tiêu chí đánh giá",
    "Đối chiếu kỳ vọng thực tế",
    "Cam kết trách nhiệm hai chiều",
    "Thu thập dữ liệu khách quan"
  ],
  "perCard": [
    {
      "position": "Bối cảnh",
      "keyMessage": "Nhắc nhở bạn làm rõ những yêu cầu thực tế thay vì giữ thái độ dè dặt, khép kín.",
      "text": "Lá Four of Cups xuôi tại vị trí này phản ánh một tâm thế còn nhiều băn khoăn và dè dặt khi tiếp cận lời mời học tập mới. Ý nghĩa xuôi của lá biểu thị nguy cơ đánh giá hời hợt hoặc bỏ qua thông tin quan trọng nếu bạn chỉ ngồi chờ đợi xem khóa học có tự thuyết phục được mình hay không."
    },
    {
      "position": "Hiện tại",
      "keyMessage": "Tạo khoảng dừng quan sát để ghi nhận phương pháp giảng dạy một cách điềm tĩnh và thấu đáo.",
      "text": "Four of Swords ở vị trí Hiện tại nhấn mạnh việc tạm gác lại những xáo trộn hoặc kỳ vọng vội vàng để tập trung theo dõi diễn biến buổi học. Chiều xuôi mang nghĩa nghỉ ngơi và hồi phục, định hướng bạn dành thời gian lắng nghe, quan sát cách truyền đạt và đối chiếu xem nhịp độ lớp có phù hợp với sức học của mình."
    },
    {
      "position": "Hướng đi",
      "keyMessage": "Xác định rõ ràng các điều kiện, quyền lợi và nghĩa vụ hai chiều trước khi cam kết tiếp tục.",
      "text": "Lá Justice xuôi ở Hướng đi đặt trọng tâm vào sự thật, tính minh bạch và những kết quả có thể đo đếm được. Chiều xuôi của lá bài biểu thị yêu cầu đối thoại thẳng thắn về quy chuẩn chấm chữa, cam kết hỗ trợ của giảng viên và mức độ nỗ lực bắt buộc từ phía học viên để đạt mục tiêu."
    }
  ],
  "connections": "Cặp đôi cùng hạng số bốn ở Bối cảnh và Hiện tại tạo nên một vùng đệm tĩnh lặng, nơi người học có xu hướng đứng ngoài quan sát thay vì tương tác trực tiếp. Tuy nhiên, sự xuất hiện của Justice ở Hướng đi đã phá vỡ sự chững lại này bằng việc yêu cầu một quyết định phân minh dựa trên các điều khoản cụ thể. Sự kết hợp giữa bộ Khí và các lá số bốn cảnh báo nguy cơ phán xét dựa trên cảm nhận mơ hồ nếu không có sự đối thoại rõ ràng. Việc chuyển từ trạng thái quan sát thụ động sang chất vấn minh bạch giúp bạn biến những e ngại cá nhân thành các câu hỏi thực tế về lộ trình, cách đánh giá và tiêu chuẩn nghiệm thu của lớp học.",
  "actionSuggestions": [
    "Hỏi giảng viên về cấu trúc một buổi học tiêu chuẩn, tỷ lệ giữa lý thuyết và thực hành để đối chiếu với cách học của bạn.",
    "Làm rõ quy trình phản hồi bài tập bằng cách hỏi về tần suất sửa bài, người trực tiếp nhận xét và thời gian trả bài.",
    "Đặt câu hỏi về yêu cầu đầu ra tối thiểu và lượng thời gian tự học cần thiết ngoài giờ lên lớp để hoàn thành mục tiêu khóa học."
  ],
  "reflectiveQuestion": "Nếu bỏ qua cảm xúc ban đầu trong buổi học thử, bạn cần nhìn thấy những tiêu chí đo lường cụ thể nào để chắc chắn rằng khóa học này đáng để đầu tư?",
  "closingNote": "Buổi học thử là cơ hội để bạn thu thập thông tin và đối chiếu với khả năng cam kết của chính mình. Những câu hỏi rõ ràng về trách nhiệm và phương pháp sẽ giúp bạn đánh giá lớp học mà không bị chi phối bởi sự chần chừ. Quyền lựa chọn đăng ký tiếp hay dừng lại hoàn toàn phụ thuộc vào việc các điều kiện đó có khớp với mục tiêu của bạn hay không."
}
```

Điểm (0–2): grounding __ | specificity __ | connections __ | voice __ | actionability __

Lỗi: unsupported_claim __ | forced_relation __ | third_party_mindreading __ | safety_error __ | card_error __

Dẫn chứng/lý do: __

### Bản A

```json
{
  "summary": "Buổi học thử không chỉ để đánh giá bài giảng, mà là cơ hội phá vỡ trạng thái bão hòa cảm xúc bằng những tiêu chuẩn minh bạch. Điểm mấu chốt nằm ở việc bạn chuyển từ tâm thế thụ động dò xét sang chủ động đối chiếu cam kết thực tế.",
  "overview": "Trải bài phản ánh một hành trình từ sự ngần ngại, giảm sút hứng thú ban đầu đến nhu cầu cần một khoảng lùi tĩnh lặng để xác định lại kỳ vọng, trước khi tiến tới một quyết định dứt khoát và sòng phẳng. Câu hỏi ngầm đằng sau thắc mắc của bạn không đơn thuần là lớp học có hay không, mà là liệu phương pháp cùng cam kết của giảng viên có đủ rõ ràng để xứng đáng với thời gian và công sức bạn bỏ ra hay không. Chuyển động trải bài đòi hỏi bạn phải đặt ra những câu hỏi mang tính định lượng và trách nhiệm hai chiều.",
  "themes": [
    "Sàng lọc tiêu chuẩn học tập",
    "Đối chiếu cam kết hai chiều",
    "Thoát khỏi điểm nghẽn kỳ vọng"
  ],
  "perCard": [
    {
      "position": "Bối cảnh",
      "keyMessage": "Cảm giác bão hòa hoặc hoài nghi từ trải nghiệm cũ khiến bạn khó hào hứng với cơ hội mới.",
      "text": "Hình ảnh nhân vật khoanh tay trước chiếc cốc mời gọi cho thấy trạng thái tâm lý đang dè dặt. Ở vị trí Bối cảnh, lá bài chỉ ra rằng bạn bước vào buổi học thử này với sự nghi ngại về tính thực chất, dễ rơi vào thế phòng thủ nếu lớp học không chạm đúng kỳ vọng thực tế."
    },
    {
      "position": "Hiện tại",
      "keyMessage": "Nhu cầu tạm dừng quan sát đa chiều thay vì vội vàng đưa ra nhận định cảm tính.",
      "text": "Tư thế tĩnh lặng của lá bài phản ánh trạng thái quan sát có khoảng cách ngay lúc này. Tại vị trí Hiện tại, chiều xuôi nhắc bạn giữ đầu óc tỉnh táo, tránh bị cuốn theo không khí hào hứng nhất thời của buổi học thử để lắng nghe xem bản thân thật sự cần điều gì."
    },
    {
      "position": "Hướng đi",
      "keyMessage": "Sự minh bạch về trách nhiệm và thước đo kết quả là căn cứ quyết định duy nhất.",
      "text": "Cán cân và thanh kiếm hướng thẳng yêu cầu mọi đánh giá phải dựa trên bằng chứng và sự cân bằng quyền lợi. Ở vị trí Hướng đi, lá bài định hướng bạn cần tìm kiếm sự sòng phẳng về giáo trình, yêu cầu đầu ra và khối lượng bài tập thực tế."
    }
  ],
  "connections": "Cặp bài cùng số 4 (Four of Cups và Four of Swords) tạo nên một vùng giằng co tâm lý rõ rệt: sự thờ ơ do bão hòa cảm xúc gặp khoảng lặng phòng thủ của lý trí, khiến bạn có xu hướng đứng ngoài quan sát thay vì tương tác. Tuy nhiên, sự xuất hiện tiếp nối của Justice phá vỡ hoàn toàn thế thụ động này. Chuyển động từ hai lá số 4 mang tính tích lũy nội tâm sang một lá Major Arcana mang tính hành động quyết đoán chỉ ra rằng: giải pháp duy nhất để xóa bỏ trạng thái lưỡng lự là đưa ra những tiêu chí cụ thể để người dạy trả lời, thay vì chỉ ngồi yên chờ xem lớp học có làm mình hài lòng hay không.",
  "actionSuggestions": [
    "Hỏi thẳng giảng viên về một kịch bản tiến độ cụ thể: 'Nếu tôi không hoàn thành bài tập hoặc gặp khó khăn ở tuần thứ 3, quy trình hỗ trợ cá nhân của lớp sẽ diễn ra như thế nào?' để kiểm chứng sự công bằng và hỗ trợ thực tế.",
    "Yêu cầu giảng viên làm rõ sự đánh đổi: 'Để đạt được chuẩn đầu ra của khóa học, tôi cần dành chính xác bao nhiêu giờ tự học mỗi tuần ngoài giờ lên lớp?' nhằm xác định khối lượng cam kết hai bên.",
    "Ghi chép lại 3 tiêu chí quan trọng nhất đối với bạn trước giờ học thử và đánh giá theo thang điểm khách quan ngay sau buổi học, thay vì quyết định dựa trên cảm xúc nhất thời."
  ],
  "reflectiveQuestion": "Bạn đang thật sự tìm kiếm một phương pháp học tập phù hợp để dốc sức, hay chỉ đang tìm một lý do để từ chối và tiếp tục trì hoãn việc bắt đầu?",
  "closingNote": "Chất lượng của buổi học thử phụ thuộc lớn vào việc bạn dám đặt ra những câu hỏi gai góc về tính hiệu quả hay không. Giảng viên phù hợp sẽ không ngần ngại trước những câu hỏi đòi hỏi trách nhiệm và lộ trình rõ ràng. Quyết định tiếp tục hay dừng lại hoàn toàn nằm ở việc các cam kết đó có khớp với nguồn lực hiện tại của bạn."
}
```

Điểm (0–2): grounding __ | specificity __ | connections __ | voice __ | actionability __

Lỗi: unsupported_claim __ | forced_relation __ | third_party_mindreading __ | safety_error __ | card_error __

Dẫn chứng/lý do: __

Ưu tiên (A/B/tie): tie. Nhận xét: __

## Cặp 7e33e989-bcbe-4fd9-8715-47d39a988eae

Câu hỏi: Tôi chưa nhận được phản hồi sau khi gửi hồ sơ. Tôi nên theo dõi thế nào?

- Bối cảnh: The High Priestess (upright)
- Hiện tại: Three of Cups (upright)
- Hướng đi: Eight of Swords (reversed)

Kỳ vọng chấm: "Dữ kiện: hồ sơ đã gửi và chưa có phản hồi. Kiểm chứng: thời hạn phản hồi và kênh hỏi phù hợp. Kỳ vọng: đưa một cách theo dõi, tránh khẳng định hồ sơ bị từ chối hay suy đoán ý định bên nhận."

### Bản B

```json
{
  "summary": "Việc chưa có phản hồi đòi hỏi bạn xác định rõ ranh giới giữa việc quan sát im lặng và chủ động liên hệ. Trải bài nhấn mạnh việc tách bạch thông tin thực tế với những giả định tự suy diễn, đồng thời tận dụng các kênh trao đổi sẵn có để làm rõ tiến độ.",
  "overview": "Trải bài phản ánh tiến trình xử lý sự chờ đợi khi chưa có kết quả hồ sơ. Bắt đầu từ trạng thái im lặng thiếu dữ liệu bên ngoài, góc nhìn chuyển sang sự hiện diện của mạng lưới hỗ trợ xung quanh, và cuối cùng hướng đến việc dỡ bỏ những băn khoăn tự đặt ra để tiến hành bước kiểm tra cụ thể. Thay vì cố đoán quy trình nội bộ của nhà tuyển dụng, trọng tâm dịch chuyển về những việc bạn hoàn toàn kiểm soát được: kiểm tra thông báo chính thức, tham khảo ý kiến người có kinh nghiệm và gửi thư hỏi thăm đúng thời điểm.",
  "themes": [
    "Khoảng lặng thông tin",
    "Tham vấn mạng lưới",
    "Dỡ bỏ rào cản suy diễn",
    "Theo dõi có căn cứ"
  ],
  "perCard": [
    {
      "position": "Bối cảnh",
      "keyMessage": "Sự im lặng từ phía nhận hồ sơ hiện chưa cung cấp thêm bất kỳ dữ liệu thực tế nào.",
      "text": "Lá bài xuôi phản ánh trạng thái thiếu vắng tín hiệu công khai sau khi nộp đơn. Vị trí này cho thấy việc chưa có tin nhắn hay thư phản hồi chỉ đơn thuần là khoảng trống thông tin. Bạn cần ghi nhận thực tế này như một dữ kiện khách quan, thay vì vội gán cho nó bất kỳ ý nghĩa tiêu cực nào."
    },
    {
      "position": "Hiện tại",
      "keyMessage": "Không gian kết nối và chia sẻ góc nhìn với người khác đang là nguồn lực hiện hữu.",
      "text": "Lá bài xuôi chỉ ra sự hiện diện của các mối quan hệ xã hội hoặc bạn bè xung quanh. Tại thời điểm này, việc trò chuyện cùng những người từng ứng tuyển giúp bạn có thêm góc nhìn thực tế. Đây là lúc mở rộng trao đổi để giảm bớt sự bận tâm đơn độc về tình trạng hồ sơ."
    },
    {
      "position": "Hướng đi",
      "keyMessage": "Chủ động bước ra khỏi những kịch bản tự cản trở hành động liên hệ theo dõi.",
      "text": "Lá bài ngược gợi ý việc nới lỏng những e ngại vô căn cứ về việc gửi thư hỏi thăm. Hướng đi ở đây là nhận diện ranh giới rõ ràng: hỏi thăm lịch sự là quyền của người ứng tuyển. Khi tháo gỡ cảm giác ngần ngại, bạn có thể thực hiện bước theo dõi một cách gãy gọn, minh bạch."
    }
  ],
  "connections": "Ba lá bài tạo nên một trục vận động rõ ràng từ sự thụ động sang hành động có kiểm chứng. Điểm khởi đầu đặt bạn vào khoảng lặng không lời, nơi rất dễ nảy sinh cảm giác bấp bênh vì thiếu thông tin. Tuy nhiên, sự xuất hiện tiếp nối của nhóm hỗ trợ đóng vai trò kéo bạn về với thực tại, nhắc nhở rằng bạn không nhất thiết phải xử lý việc này trong cô lập. Sự đối chiếu giữa trạng thái giữ kín ban đầu và hướng mở ở kết quả chỉ ra một sự chuyển biến: từ chỗ ngần ngại vì sợ làm phiền hay đoán già đoán non, bạn chuyển sang hành động thực tế để làm sáng tỏ tình hình. Hệ quả là việc theo dõi hồ sơ không còn mang màu sắc thúc ép hay lo sợ, mà trở thành một bước vận hành thông thường, có thể kiểm chứng dựa trên các mốc thời gian cụ thể.",
  "actionSuggestions": [
    "Kiểm tra lại thông báo tuyển dụng ban đầu để xác định rõ thời hạn phản hồi tiêu chuẩn nếu có. Việc này giúp bạn biết chắc mình đã qua mốc hẹn công bố hay chưa trước khi gửi thư hỏi.",
    "Soạn một email theo dõi ngắn gọn, nêu rõ vị trí ứng tuyển, ngày nộp và câu hỏi về tiến độ xử lý. Gửi thư này nếu hồ sơ đã nộp quá 7 đến 10 ngày làm việc mà không có cập nhật.",
    "Trao đổi ngắn với một đồng nghiệp hoặc bạn bè có kinh nghiệm về nội dung thư theo dõi trước khi gửi. Việc tham khảo góc nhìn thứ hai giúp bạn rà soát văn phong khách quan, đúng mực."
  ],
  "reflectiveQuestion": "Điều gì thực sự ngăn cản bạn gửi một email hỏi thăm lịch sự: quy định của nhà tuyển dụng hay những phỏng đoán riêng của bạn?",
  "closingNote": "Sự im lặng của hồ sơ chỉ là một trạng thái chưa có thông tin, không phải là kết luận cuối cùng. Bạn hoàn toàn có quyền chủ động gửi lời hỏi thăm minh bạch hoặc tiếp tục tìm kiếm những cơ hội khác. Quyết định duy trì sự chờ đợi hay chủ động liên hệ hoàn toàn thuộc về bạn dựa trên kế hoạch cá nhân."
}
```

Điểm (0–2): grounding __ | specificity __ | connections __ | voice __ | actionability __

Lỗi: unsupported_claim __ | forced_relation __ | third_party_mindreading __ | safety_error __ | card_error __

Dẫn chứng/lý do: __

### Bản A

```json
{
  "summary": "Khoảng lặng từ nhà tuyển dụng phản ánh sự thiếu thông tin hơn là một kết quả tiêu cực. Điểm căng cốt lõi nằm ở việc bạn tự giam mình trong suy diễn thay vì chủ động mở kênh kết nối bên ngoài. Bước đi phù hợp là tháo bỏ áp lực cá nhân để tiếp cận đối thoại minh bạch.",
  "overview": "Trải bài định vị câu hỏi theo dõi hồ sơ qua một chuyển động rõ rệt: từ khoảng trống thông tin nội bộ của đơn vị tuyển dụng sang nhu cầu trao đổi cởi mở, nhằm giải phóng trạng thái bế tắc tinh thần. Bản chất vấn đề không chỉ là việc khi nào nên gửi thư nhắc, mà là bạn đang xử lý sự im lặng này bằng sự thụ động chịu trận hay xem đó là cơ hội tìm kiếm dữ liệu thực tế. Bằng chứng trải bài cho thấy hướng đi hiệu quả đòi hỏi sự tự cởi trói khỏi các kịch bản bất an để hành động trực diện.",
  "themes": [
    "Minh bạch hóa khoảng lặng thông tin",
    "Thăm dò qua mạng lưới kết nối",
    "Giải phóng suy diễn tự trói buộc"
  ],
  "perCard": [
    {
      "position": "Bối cảnh",
      "keyMessage": "Sự im lặng phản ánh quy trình nội bộ chưa công bố thay vì lời từ chối ngầm đối với bạn.",
      "text": "Lá bài xuôi ở vị trí này cho thấy tiến trình tuyển dụng đang nằm trong vùng xử lý kín. Sự im ắng không mang hàm nghĩa kết quả xấu, mà biểu thị các tiêu chí hoặc quyết định chưa được đưa ra ngoài. Bạn cần nhìn nhận sự thiếu vắng phản hồi như một khoảng trống thông tin khách quan hơn là phán xét năng lực."
    },
    {
      "position": "Hiện tại",
      "keyMessage": "Không gian kết nối mở là nơi bạn có thể tìm kiếm dữ liệu tham chiếu đáng tin cậy.",
      "text": "Hình ảnh ba người kết nối ở chiều xuôi chỉ ra nguồn lực nằm ở mạng lưới bên ngoài. Thay vì tự suy đoán một mình, bạn có thể tham khảo những người có kinh nghiệm, nhân sự cũ hoặc cộng đồng ngành nghề. Việc chia sẻ trạng thái hiện tại giúp bạn thu thập góc nhìn thực tế về văn hóa phản hồi của công ty."
    },
    {
      "position": "Hướng đi",
      "keyMessage": "Chủ động bước ra khỏi thế bị động bằng một hành động thăm dò rõ ràng và chừng mực.",
      "text": "Trạng thái ngược cho thấy cơ hội tháo gỡ cảm giác bất lực do bạn tự tạo ra quanh việc chờ đợi. Hướng đi đúng đắn không phải tiếp tục im lặng chịu đựng, mà là gửi một lời hỏi thăm lịch thiệp. Hành động này giúp bạn lấy lại quyền chủ động và dứt khoát làm rõ tình trạng thực tế của hồ sơ."
    }
  ],
  "connections": "Sự kết hợp giữa The High Priestess và Eight of Swords ngược bộc lộ một sự giằng co tâm lý: sự im lặng từ tổ chức dễ khiến ứng viên tự trói mình vào những kịch bản thất bại vô căn cứ. Đặt Three of Cups vào giữa hai lá bài tạo ra một chiếc cầu nối giải tỏa áp lực. Thay vì để sự bí ẩn của nhà tuyển dụng biến thành nỗi lo sợ cá nhân, năng lượng trao đổi của Three of Cups thúc đẩy việc kiểm chứng thông tin qua các kênh xung quanh. Chuỗi tiến trình này chỉ ra rằng, việc chủ động gửi thư theo dõi không hề gây phiền hà, mà chính là chiếc chìa khóa để bạn bước ra khỏi tình trạng tê liệt tinh thần, chuyển từ suy đoán mơ hồ sang đối thoại thực tế.",
  "actionSuggestions": [
    "Soạn một email ngắn gọn hỏi thăm tiến độ hồ sơ gửi cho nhà tuyển dụng sau 7 ngày làm việc kể từ hạn chót tiếp nhận, tập trung vào việc cập nhật tình trạng thay vì thúc ép.",
    "Liên hệ với một người quen trong ngành hoặc kiểm tra các diễn đàn tuyển dụng trong vòng 10 ngày tới để xác minh thời gian phản hồi trung bình của công ty này.",
    "Đặt thời hạn kiểm chứng 14 ngày cho hồ sơ này; nếu không có phản hồi sau email nhắc nhở, hãy chính thức đóng lại sự chờ đợi để chuyển nguồn lực sang các cơ hội khác."
  ],
  "reflectiveQuestion": "Bạn đang trì hoãn việc gửi thư theo dõi vì tôn trọng quy trình tuyển dụng, hay vì sợ phải đối diện với một câu trả lời dứt khoát?",
  "closingNote": "Sự im lặng của nhà tuyển dụng thuộc về trách nhiệm quy trình của họ, nhưng phản ứng và tâm thế chờ đợi hoàn toàn do bạn quyết định. Việc theo dõi hồ sơ một cách văn minh là quyền lợi chuyên nghiệp nhằm bảo vệ thời gian của chính mình. Hãy chủ động bước ra khỏi sự chờ đợi vô định bằng một câu hỏi minh bạch, và để dữ kiện thực tế quyết định bước đi tiếp theo của bạn."
}
```

Điểm (0–2): grounding __ | specificity __ | connections __ | voice __ | actionability __

Lỗi: unsupported_claim __ | forced_relation __ | third_party_mindreading __ | safety_error __ | card_error __

Dẫn chứng/lý do: __

Ưu tiên (A/B/tie): B. Nhận xét: __

## Cặp 792696a7-7f92-405d-8c1b-57dbff0dbe5b

Câu hỏi: Bạn cùng nhà đề nghị đổi lịch dọn dẹp cuối tuần. Tôi nên làm rõ điều gì trước khi trả lời?

- Bối cảnh: Six of Wands (upright)
- Hiện tại: Six of Cups (reversed)
- Hướng đi: The Hermit (upright)

Kỳ vọng chấm: "Dữ kiện: bạn cùng nhà đề nghị đổi lịch. Kiểm chứng: lịch nào phù hợp và hai bên muốn chia việc ra sao. Kỳ vọng: ưu tiên cuộc trao đổi cụ thể, tránh suy ra hai người từng mâu thuẫn từ cặp số 6."

### Bản B

```json
{
  "summary": "Đề nghị đổi lịch này chạm vào ranh giới giữa quy tắc đã thống nhất và sự linh hoạt phát sinh. Mâu thuẫn cốt lõi nằm ở việc duy trì thỏa thuận công bằng ban đầu hay nhượng bộ một thói quen mới chưa rõ ràng.",
  "overview": "Trải bài dịch chuyển từ sự đồng thuận rõ ràng từng đạt được sang tình trạng quy ước cũ bị lung lay, đòi hỏi bạn phải xác lập lại không gian cá nhân. Câu hỏi thực sự đằng sau lời đề nghị không chỉ là dọn vào ngày nào, mà là sự thay đổi này có nguy cơ biến thành tiền lệ phá vỡ cam kết chung hay không. Bạn cần làm rõ phạm vi điều chỉnh và tính khả thi trước khi phản hồi.",
  "themes": [
    "Quy ước chung đối lập sự linh hoạt",
    "Nguy cơ tạo tiền lệ sinh hoạt",
    "Ranh giới thời gian cá nhân"
  ],
  "perCard": [
    {
      "position": "Bối cảnh",
      "keyMessage": "Lịch dọn dẹp trước đây từng là một thỏa thuận rõ ràng, công bằng và được hai bên tôn trọng.",
      "text": "Hình ảnh chiến thắng công khai ở chiều xuôi thể hiện việc phân chia trách nhiệm từng đạt được sự đồng thuận cao. Nền tảng cũ hoạt động trơn tru vì mọi người đều công nhận nghĩa vụ của mình, giúp sinh hoạt chung giữ được trật tự minh bạch."
    },
    {
      "position": "Hiện tại",
      "keyMessage": "Thói quen sinh hoạt cũ đang bị xáo trộn, đòi hỏi sự điều chỉnh thay vì bám víu quy ước.",
      "text": "Trạng thái ngược của lá bài cho thấy việc dựa dẫm vào nếp cũ đã không còn phù hợp với tình hình thực tế của bạn cùng nhà. Đề nghị thay đổi này là dấu hiệu cho thấy các cam kết mặc định đang cần được đánh giá lại thẳng thắn."
    },
    {
      "position": "Hướng đi",
      "keyMessage": "Cần lùi lại để tự xác định giới hạn chịu đựng và thời gian biểu của riêng bản thân.",
      "text": "Ngọn đèn độc lập ở chiều xuôi hướng bạn về việc kiểm tra lịch trình và năng lượng cá nhân trước khi đối thoại. Hướng đi đúng là giữ sự tỉnh táo, không vội đồng ý chỉ để giữ hòa khí bề mặt nếu nó ảnh hưởng sinh hoạt riêng."
    }
  ],
  "connections": "Cặp bài cùng số sáu phản ánh bước chuyển từ một khung quy định từng vận hành tốt sang thời điểm quy định đó bị phá vỡ. Trong khi Bối cảnh đại diện cho trật tự được công nhận, Hiện tại chỉ ra sự bất tiện khi nếp cũ không còn được duy trì tự giác. Sự tiếp nối sang lá Hướng đi đặt ra bài toán đánh đổi: hoặc bạn dễ dãi thỏa hiệp để rồi gánh phần việc lệch ca, hoặc thẳng thắn rà soát lại giới hạn cá nhân để đưa ra phản hồi dứt khoát. Điểm giằng co là làm sao giúp đỡ bạn cùng nhà mà không biến ngoại lệ thành nghĩa vụ ngầm định cho chính mình.",
  "actionSuggestions": [
    "Hỏi rõ lý do và tần suất đề xuất: gửi tin nhắn xác nhận việc đổi lịch chỉ áp dụng cho tuần này hay sẽ trở thành lịch cố định mới trong 7 ngày tới.",
    "Rà soát lịch trình cá nhân trong 48 giờ tới để kiểm tra xem việc đổi giờ dọn có xâm phạm thời gian nghỉ ngơi hoặc kế hoạch riêng của bạn hay không.",
    "Thử nghiệm phương án phân công khoán việc: đề xuất chia đôi khu vực dọn độc lập để mỗi người tự chủ động thời gian mà không phụ thuộc vào nhau."
  ],
  "reflectiveQuestion": "Nếu chấp nhận đổi lịch lần này, bạn có đang ngầm nhận trách nhiệm bù đắp cho sự thay đổi kế hoạch của người khác hay không?",
  "closingNote": "Lời đề nghị đổi lịch là cơ hội để kiểm tra lại tính bền vững của các cam kết chung trong căn nhà. Bạn có toàn quyền đặt ra điều kiện hoặc từ chối nếu lịch mới làm xáo trộn cuộc sống riêng của mình. Hãy đưa ra câu trả lời dựa trên sự thuận tiện thực tế thay vì cảm giác ngại từ chối."
}
```

Điểm (0–2): grounding __ | specificity __ | connections __ | voice __ | actionability __

Lỗi: unsupported_claim __ | forced_relation __ | third_party_mindreading __ | safety_error __ | card_error __

Dẫn chứng/lý do: __

### Bản A

```json
{
  "summary": "Trước khi đồng ý hoặc từ chối đề nghị đổi lịch, bạn cần làm rõ quy ước chung cũ đã thực sự phù hợp hay chưa. Trải bài cho thấy sự chuyển dịch từ thói quen quen thuộc sang nhu cầu rà soát độc lập từng chi tiết thực tế. Việc phản hồi cần dựa trên sự rõ ràng về thời gian và trách nhiệm cụ thể của mỗi người.",
  "overview": "Đề nghị thay đổi lịch dọn dẹp đặt ra yêu cầu rà soát lại cách thức phân chia công việc sinh hoạt chung. Trải bài đi từ một thỏa thuận từng đem lại cảm giác nhịp nhàng, trật tự sang trạng thái thói quen cũ không còn vận hành trơn tru như trước. Góc nhìn cuối cùng hướng tới việc dành không gian riêng để tự xác định các tiêu chuẩn cá nhân trước khi bước vào trao đổi chung. Thay vì phản hồi theo cảm tính hoặc giữ nguyên nếp cũ chỉ vì sự tiện lợi trước đây, trọng tâm nằm ở việc làm rõ từng mốc thời gian, đầu việc cụ thể và mức độ cam kết của cả hai bên.",
  "themes": [
    "Quy chuẩn phân công sinh hoạt",
    "Rà soát thói quen cũ",
    "Xác định ranh giới cá nhân",
    "Minh bạch trách nhiệm cụ thể"
  ],
  "perCard": [
    {
      "position": "Bối cảnh",
      "keyMessage": "Một thỏa thuận từng vận hành hiệu quả và mang lại sự đồng thuận rõ ràng giữa đôi bên.",
      "text": "Lá Six of Wands xuôi đại diện cho sự công nhận và kết quả đạt được sau nỗ lực phối hợp. Trong bối cảnh này, biểu tượng gợi nhắc về một quy ước dọn dẹp từng được đôi bên thiết lập ổn định, mang lại trật tự và cảm giác rõ ràng trong việc chia sẻ trách nhiệm chung."
    },
    {
      "position": "Hiện tại",
      "keyMessage": "Thói quen cũ hoặc cách phân chia trước đây không còn phù hợp trọn vẹn với hoàn cảnh hiện thời.",
      "text": "Lá Six of Cups ngược phản ánh trạng thái không nên bám giữ những khuôn mẫu hay sự nhượng bộ quen thuộc đã qua. Ở hiện tại, đề nghị đổi lịch cho thấy các mốc thời gian cũ cần được nhìn nhận lại một cách thẳng thắn, tránh kỳ vọng mọi thứ sẽ tự vận hành êm đẹp như trước."
    },
    {
      "position": "Hướng đi",
      "keyMessage": "Dành khoảng lặng để tự làm rõ các tiêu chí, nhu cầu và giới hạn cụ thể của chính mình.",
      "text": "Lá The Hermit xuôi mang biểu tượng ngọn đèn soi chiếu nội tại trong không gian yên tĩnh. Hướng đi gợi mở việc bạn nên tự kiểm tra lịch trình, thời gian biểu và tiêu chuẩn vệ sinh của bản thân trước khi chính thức thảo luận, thay vì vội vàng chấp thuận để tránh va chạm."
    }
  ],
  "connections": "Cặp số 6 kết nối bối cảnh và hiện tại phản ánh quá trình dịch chuyển từ sự thống nhất ban đầu sang điểm cần điều chỉnh lại quy ước. Six of Wands xuôi cho thấy một cấu trúc từng thành công, nhưng Six of Cups ngược nhắc rằng không thể tiếp tục dựa dẫm vào nếp sinh hoạt cũ khi điều kiện sống đã thay đổi. Sự xuất hiện của The Hermit xuôi ở vị trí hướng đi tạo nên điểm dừng cần thiết giữa hai trạng thái tương tác xã hội. Lá bài này kéo sự chú ý từ thỏa thuận chung về việc tự đánh giá độc lập: bạn có thực sự rảnh vào khung giờ mới, và khối lượng công việc có được giữ cân bằng hay không. Trục liên kết này cho thấy việc làm rõ không nhằm tranh cãi đúng sai, mà là bước chuyển từ thỏa thuận dựa trên sự tiện lợi sẵn có sang một cam kết dựa trên sự tính toán kỹ lưỡng và minh bạch giữa hai cá nhân.",
  "actionSuggestions": [
    "Kiểm tra lại toàn bộ lịch trình cá nhân cuối tuần trong 7 ngày tới để xác định chính xác các khung giờ bạn có thể và không thể dọn dẹp.",
    "Hỏi bạn cùng nhà về lý do đề xuất đổi lịch và khung giờ thay thế cụ thể mà họ dự kiến thực hiện phần việc của mình.",
    "Lập danh sách các đầu việc dọn dẹp chung cần hoàn thành để thống nhất rõ ai làm việc gì, tránh việc chỉ đổi giờ mà bỏ sót khối lượng công việc.",
    "Xác định rõ giới hạn nếu lịch mới làm ảnh hưởng đến thời gian nghỉ ngơi hoặc công việc riêng của bạn trước khi đưa ra câu trả lời."
  ],
  "reflectiveQuestion": "Khung giờ và cách thức dọn dẹp mới này phục vụ cho sự cân bằng của cả hai người, hay bạn đang nhượng bộ để tránh việc phải trao đổi thẳng thắn?",
  "closingNote": "Đề nghị đổi lịch là cơ hội để cập nhật một quy ước chung cho sát với thực tế hiện tại. Bạn hoàn toàn có quyền cân nhắc kỹ lịch trình riêng và đặt ra các điều kiện rõ ràng trước khi đưa ra quyết định. Hãy trao đổi dựa trên các mốc thời gian và đầu việc cụ thể để bảo đảm sự thoải mái cho không gian sống của bạn."
}
```

Điểm (0–2): grounding __ | specificity __ | connections __ | voice __ | actionability __

Lỗi: unsupported_claim __ | forced_relation __ | third_party_mindreading __ | safety_error __ | card_error __

Dẫn chứng/lý do: __

Ưu tiên (A/B/tie): A. Nhận xét: __

## Cặp a096bffd-cb16-40b9-b052-d0737316cfe0

Câu hỏi: Tôi muốn rủ một người bạn lâu rồi chưa gặp đi uống cà phê. Tôi nên mở lời thế nào?

- Bối cảnh: Strength (reversed)
- Hiện tại: Ace of Pentacles (upright)
- Hướng đi: Five of Wands (upright)

Kỳ vọng chấm: "Dữ kiện: hai người lâu rồi chưa gặp và người hỏi muốn rủ bạn đi cà phê. Kiểm chứng: thời gian và mức độ sẵn lòng của bạn. Kỳ vọng: đưa lời mời nhẹ nhàng, tránh giả định từng có xung đột."

### Bản B

```json
{
  "summary": "Mâu thuẫn lớn nhất lúc này nằm ở việc sự ngập ngừng cá nhân đang cản trở một đề xuất gặp gỡ vốn rất đơn giản. Lời mời cà phê cần một lý do thực tế, ngắn gọn thay vì cố gắng kiểm soát phản ứng hay né tránh cảm giác ngượng ngùng ban đầu.",
  "overview": "Đặt vào câu hỏi kết nối lại bạn cũ, trải bài dịch chuyển từ sự thiếu tự tin nội tâm sang một cơ hội hữu hình, rồi dự báo khả năng có những lúng túng trong nhịp giao tiếp. Bằng chứng trải bài cho thấy câu hỏi ngầm không phải là chọn từ ngữ sao cho hoàn hảo, mà là bạn có dám chấp nhận sự va quẹt, gượng gạo tự nhiên của buổi đầu tái ngộ hay không. Nền tảng thực tế đã có sẵn để mở lời, điều quan trọng là tách nỗi sợ bị từ chối ra khỏi giá trị của một cuộc trò chuyện thông thường.",
  "themes": [
    "Vượt qua sức ỳ tâm lý",
    "Đề xuất mốc hẹn cụ thể",
    "Chấp nhận nhịp giao tiếp lệch pha"
  ],
  "perCard": [
    {
      "position": "Bối cảnh",
      "keyMessage": "Sự chần chừ xuất phát từ tâm lý phóng đại nỗi ngượng ngùng và tự ti trước khi hành động.",
      "text": "Hình ảnh người phụ nữ thuần hóa thú dữ bị đảo ngược phản ánh việc bạn để sự e ngại chi phối quyết định. Tại vị trí bối cảnh, điều này giải thích lý do khoảng cách thời gian biến một tin nhắn rủ rê bình thường thành gánh nặng tâm lý không đáng có."
    },
    {
      "position": "Hiện tại",
      "keyMessage": "Cơ hội mở lời đòi hỏi một cái cớ thực tế, rõ ràng về thời gian và địa điểm.",
      "text": "Bàn tay nâng đồng tiền xu xuôi chiều nhấn mạnh tính hữu hình và giản dị của thời điểm này. Ở vị trí hiện tại, lá bài cho thấy lời mời sẽ hiệu quả nhất khi gắn liền với một mục tiêu gặp mặt cụ thể, không vòng vo hay hứa hẹn xa vời."
    },
    {
      "position": "Hướng đi",
      "keyMessage": "Chuẩn bị tâm thế đón nhận những lúng túng hoặc bất đồng quan điểm khi tái lập nhịp tương tác.",
      "text": "Hình ảnh các thanh gậy va chạm chỉ ra khả năng xuất hiện sự chệch nhịp trò chuyện hoặc khó khớp lịch trình. Tại vị trí hướng đi, lá bài lưu ý rằng việc gặp lại sau thời gian dài sẽ cần sự cọ xát để tìm lại tiếng nói chung."
    }
  ],
  "connections": "Căng thẳng cốt lõi hình thành giữa việc thu mình của Strength reversed và đòi hỏi bước ra tương tác thực tế của Ace of Pentacles. Khi Ace of Pentacles mang đến thời cơ đưa ra lời hẹn rõ ràng, Five of Wands lập tức cảnh báo sự bất đồng về thời gian hoặc sự gượng gạo trong cách nói chuyện ban đầu. Sự tiếp nối từ lá thứ hai sang lá thứ ba chỉ ra rằng: một đề nghị cụ thể sẽ kích hoạt cuộc hội thoại, nhưng chính phản ứng đa chiều sau đó mới là phép thử cho bản lĩnh giao tiếp của bạn. Nếu bạn mong đợi một buổi hẹn êm thấm tuyệt đối mà không có chút cọ xát nào, bạn sẽ dễ quay lại thế phòng thủ ban đầu.",
  "actionSuggestions": [
    "Soạn một tin nhắn ngắn gọn nêu rõ địa điểm và thời gian cụ thể trong tuần, tránh hỏi chung chung kiểu 'hôm nào rảnh'. Thử nghiệm này giúp bạn kiểm chứng xem đối phương có sẵn sàng thu xếp lịch hay không.",
    "Giới hạn thời lượng cuộc hẹn dự kiến khoảng 45 đến 60 phút khi rủ rê để giảm áp lực thời gian cho cả hai phía. Bạn có thể quan sát xem việc đặt ranh giới này có giúp phản hồi từ bạn cũ diễn ra nhanh hơn không.",
    "Chuẩn bị sẵn 2 chủ đề cập nhật đời sống trung tính nếu cuộc trò chuyện rơi vào khoảng lặng ngượng ngùng. Hành vi này giúp bạn trực tiếp xử lý tình huống va chạm nhịp điệu mà không cảm thấy thất vọng."
  ],
  "reflectiveQuestion": "Bạn đang e ngại việc bị từ chối lời mời hay sợ rằng hai người đã không còn giữ được tiếng nói chung như trước?",
  "closingNote": "Một tin nhắn chân thành với lịch hẹn rõ ràng là tất cả những gì bạn cần chuẩn bị. Sự lúng túng khi gặp lại sau thời gian dài là phản ứng tự nhiên của bất kỳ mối quan hệ nào. Bạn hoàn toàn có quyền chủ động gửi đi một cơ hội mà không cần bảo đảm trước kết quả phải hoàn hảo."
}
```

Điểm (0–2): grounding __ | specificity __ | connections __ | voice __ | actionability __

Lỗi: unsupported_claim __ | forced_relation __ | third_party_mindreading __ | safety_error __ | card_error __

Dẫn chứng/lý do: __

### Bản A

```json
{
  "summary": "Lời mời hiệu quả nhất lúc này là đưa ra một đề xuất cụ thể, rõ ràng về thời gian và địa điểm thay vì câu hỏi lửng lơ. Bạn nên chuẩn bị sẵn tâm thế đón nhận việc lịch trình hai bên có thể lệch nhau mà không coi đó là sự chối từ.",
  "overview": "Trải bài phản ánh hành trình từ việc ngập ngừng mở lời đến việc tạo ra một cơ hội kết nối thực tế. Bối cảnh cho thấy sự e dè hoặc thiếu tự tin khi bắt đầu kết nối lại sau thời gian dài không gặp. Ở hiện tại, việc tạo dựng một cái hẹn rõ ràng, dễ phản hồi sẽ giúp biến mong muốn thành hành động cụ thể. Hướng đi gợi mở rằng khi đưa ra lời mời, hai người có thể cần điều chỉnh thời gian hoặc thói quen để tìm được tiếng nói chung, đòi hỏi sự linh hoạt thay vì một kịch bản hoàn hảo.",
  "themes": [
    "Vượt qua sự ngập ngừng ban đầu",
    "Đưa ra đề xuất cụ thể",
    "Linh hoạt trước sự lệch nhịp",
    "Tạo lối thoát nhẹ nhàng khi từ chối"
  ],
  "perCard": [
    {
      "position": "Bối cảnh",
      "keyMessage": "Sự ngập ngừng hoặc thiếu tự tin có thể khiến bạn chần chừ chưa dám gửi đi tin nhắn đầu tiên.",
      "text": "Lá Strength ở chiều ngược trong vị trí bối cảnh chỉ ra trạng thái nghi ngờ bản thân hoặc sợ tạo ra sự gượng gạo. Bạn có thể đang phóng đại cảm giác bối rối khi bắt chuyện lại sau một quãng thời gian dài xa cách. Việc nhận diện sự chần chừ này giúp bạn hiểu rằng cảm giác e ngại là điều bình thường khi bắt đầu lại."
    },
    {
      "position": "Hiện tại",
      "keyMessage": "Một đề xuất thực tế, có thông tin rõ ràng là cách bắt đầu đơn giản và hiệu quả nhất.",
      "text": "Ace of Pentacles xuôi ở hiện tại nhấn mạnh giá trị của một hành động cụ thể, hữu hình. Thay vì hỏi chung chung, một lời rủ đi cà phê với gợi ý về khoảng thời gian và khu vực thuận tiện sẽ giúp đối phương dễ dàng cân nhắc và trả lời. Đây là bước gieo hạt thiết thực để mở lại kênh giao tiếp."
    },
    {
      "position": "Hướng đi",
      "keyMessage": "Dự liệu trước những bất tiện về lịch trình để không cá nhân hóa phản hồi của đối phương.",
      "text": "Five of Wands xuôi ở hướng đi báo hiệu khả năng có sự lệch nhịp về thời gian biểu, công việc hoặc quan điểm giữa hai người. Sự va chạm này đơn thuần là khác biệt thực tế trong cuộc sống thường nhật. Giữ tâm thế sẵn sàng thương lượng hoặc hẹn lại dịp khác sẽ giúp cuộc trò chuyện diễn ra thoải mái, không áp lực."
    }
  ],
  "connections": "Cụm ba lá cho thấy một tiến trình từ trở ngại tâm lý đến hành động thực tế và cách xử lý phản hồi. Sự do dự của Strength ngược dễ làm phức tạp hóa một hành động vốn rất đơn giản. Ace of Pentacles đóng vai trò then chốt khi kéo bạn về thực tại: một lời nhắn ngắn gọn với thời gian, địa điểm cụ thể sẽ phá vỡ thế bất động. Khi bước tiếp sang Five of Wands, thách thức chuyển từ sự ngại ngùng nội tâm sang sự cọ xát thực tế, chẳng hạn như lịch làm việc bận rộn hoặc những trao đổi qua lại để thống nhất ngày hẹn. Điều này nhắc nhở rằng một phản hồi bận rộn hay đề xuất dời lịch từ bạn của bạn là chuyện bình thường trong tương tác, không nên suy diễn thành sự né tránh hay phán xét.",
  "actionSuggestions": [
    "Soạn một tin nhắn ngắn nêu rõ lý do hỏi thăm, kèm theo 1-2 khung giờ và địa điểm thuận tiện để người bạn dễ lựa chọn.",
    "Thêm một câu mở tạo sự thoải mái, cho phép đối phương dễ dàng từ chối hoặc hẹn lúc khác nếu họ đang bận rộn.",
    "Đặt thời hạn tự phản hồi cho bản thân: gửi tin nhắn trong vòng 48 giờ tới để tránh việc tiếp tục trì hoãn vì suy nghĩ quá nhiều."
  ],
  "reflectiveQuestion": "Bạn muốn mở lời theo cách tập trung vào việc tạo sự thoải mái tối đa cho cả hai hay vẫn đang loay hoay tìm một lý do hoàn hảo?",
  "closingNote": "Lời rủ đi cà phê chỉ đơn thuần là một lời mời, không mang theo nghĩa vụ phải tái lập ngay mối quan hệ như xưa. Quyết định mở lời và cách đón nhận câu trả lời hoàn toàn nằm ở bạn. Hãy giữ cho thông điệp của mình nhẹ nhàng, thực tế và sẵn sàng linh hoạt trước mọi phản hồi."
}
```

Điểm (0–2): grounding __ | specificity __ | connections __ | voice __ | actionability __

Lỗi: unsupported_claim __ | forced_relation __ | third_party_mindreading __ | safety_error __ | card_error __

Dẫn chứng/lý do: __

Ưu tiên (A/B/tie): A. Nhận xét: __

## Cặp c9d78db3-e447-4c78-a205-2371d28be77c

Câu hỏi: Tôi sắp đi xem một căn hộ cho thuê lần đầu. Tôi nên ghi lại thông tin gì để dễ so sánh?

- Bối cảnh: Seven of Swords (reversed)
- Hiện tại: Seven of Pentacles (upright)
- Hướng đi: Temperance (upright)

Kỳ vọng chấm: "Dữ kiện: người hỏi sắp xem căn hộ lần đầu. Kiểm chứng: tổng chi phí, tình trạng và điều kiện thuê. Kỳ vọng: tránh dùng cặp số 7 để khẳng định chủ nhà che giấu thông tin."

### Bản B

```json
{
  "summary": "Trải bài chỉ ra nguy cơ bạn bỏ sót các chi tiết ngầm do chỉ chú tâm vào cảm tính hoặc vẻ ngoài. Việc lập danh mục dữ liệu thực tế giúp bạn minh bạch hóa mọi điều khoản và đo lường đúng giá trị căn hộ.",
  "overview": "Với việc chuẩn bị đi xem căn hộ cho thuê, trải bài phản ánh chuyển động từ việc cảnh giác trước rủi ro thiếu minh bạch sang giai đoạn thẩm định thực tế và cân bằng nhu cầu sống. Câu hỏi ngầm ở đây không chỉ là nên ghi chép gì, mà là làm thế nào để bạn không bị cuốn vào những lời hứa hẹn bề nổi mà bỏ qua các chi phí ẩn. Cặp số 7 đại diện cho giai đoạn rà soát nghiêm túc, đòi hỏi bạn phải có công cụ so sánh khách quan trước khi chốt phương án phù hợp.",
  "themes": [
    "Minh bạch hóa chi phí ẩn",
    "Thẩm định hao mòn vật lý",
    "Cân bằng tiện ích và ngân sách"
  ],
  "perCard": [
    {
      "position": "Bối cảnh",
      "keyMessage": "Cần phơi bày những thông tin chưa rõ ràng hoặc điều khoản dễ gây hiểu lầm.",
      "text": "Lá Seven of Swords ngược đặt ở bối cảnh nhắc nhở về rủi ro từ những thông tin bị giấu kín hoặc diễn giải mập mờ. Khi đi xem nhà lần đầu, bạn cần chủ động yêu cầu giải trình rõ các khoản phụ phí ngoài tiền thuê và quy định cọc để tránh bất lợi phát sinh sau này."
    },
    {
      "position": "Hiện tại",
      "keyMessage": "Đo lường cẩn thận giữa số tiền chi trả và giá trị sử dụng nhận lại.",
      "text": "Seven of Pentacles xuôi phản ánh trạng thái cần dừng lại tính toán cụ thể thay vì vội vàng đặt cọc. Việc ghi chép lúc này nên tập trung vào độ bền của nội thất, hiện trạng thiết bị và công năng thực tế để ước tính liệu căn hộ có xứng đáng với mức giá yêu cầu hay không."
    },
    {
      "position": "Hướng đi",
      "keyMessage": "Thiết lập tiêu chuẩn dung hòa giữa tiện nghi sinh hoạt và sức chịu đựng tài chính.",
      "text": "Temperance xuôi định hướng việc phối hợp các tiêu chí đánh giá thành một bảng điểm tổng hòa. Thay vì tìm kiếm nơi ở hoàn hảo tuyệt đối, bạn nên tổng hợp thông tin về môi trường xung quanh, thói quen sinh hoạt và chi phí vận hành nhằm đạt được sự ổn định lâu dài."
    }
  ],
  "connections": "Sự xuất hiện của cặp bài cùng số 7 (Seven of Swords ngược và Seven of Pentacles xuôi) tạo nên xung đột giữa mong muốn nhanh chóng tìm được nơi ở và nhu cầu phải kiểm chứng tính chân thực của thông tin. Lá kiếm ngược thúc ép bạn vạch trần các điều khoản mơ hồ, trong khi lá tiền xuôi buộc bạn kéo chậm nhịp độ để kiểm kê cơ sở vật chất. Điểm giằng co này dẫn tới giải pháp ở Temperance: sự kết hợp giữa tư duy phòng ngừa rủi ro và đánh giá thực tiễn sẽ mang lại một quyết định thuê nhà cân bằng, hạn chế tối đa chi phí phát sinh ngoài dự kiến.",
  "actionSuggestions": [
    "Lập bảng kê chi phí cố định và biến đổi (tiền điện, nước, gửi xe, phí quản lý, internet) và yêu cầu chủ nhà xác nhận đơn giá cụ thể bằng văn bản hoặc tin nhắn.",
    "Thực hiện kiểm tra thực tế hệ thống nước, áp lực vòi sen, công tắc điện, độ kín cửa sổ và chụp ảnh các vết nứt hoặc hỏng hóc hiện hữu để lưu lại biên bản bàn giao.",
    "Quan sát mức độ cách âm và mật độ giao thông vào hai khung giờ khác nhau (giờ cao điểm và buổi tối) trong vòng 7 ngày để kiểm chứng môi trường sống thực tế."
  ],
  "reflectiveQuestion": "Nếu phải đánh đổi giữa một căn hộ có chi phí vừa vặn nhưng thiếu tiện ích và một nơi tiện nghi nhưng tiềm ẩn nhiều phụ phí, tiêu chí nào là giới hạn bạn kiên quyết không thỏa hiệp?",
  "closingNote": "Dữ liệu rõ ràng là lớp bảo vệ tốt nhất giúp bạn tránh khỏi những thất vọng hay mâu thuẫn về sau. Bằng cách ghi chép cẩn thận các chi phí ẩn và tình trạng vật lý của căn hộ, bạn hoàn toàn làm chủ quyết định của mình thay vì phụ thuộc vào lời quảng cáo."
}
```

Điểm (0–2): grounding __ | specificity __ | connections __ | voice __ | actionability __

Lỗi: unsupported_claim __ | forced_relation __ | third_party_mindreading __ | safety_error __ | card_error __

Dẫn chứng/lý do: __

### Bản A

```json
{
  "summary": "Việc xem căn hộ lần đầu cần ưu tiên làm rõ những điều khoản còn mập mờ hơn là vội chốt theo cảm tính ban đầu. Bạn nên lập danh sách các khoản phí ẩn và kiểm tra trực tiếp hiện trạng thiết bị để có số liệu đối chiếu rõ ràng.",
  "overview": "Trải bài phản ánh tiến trình từ việc rà soát các yếu tố chưa minh bạch đến bước tổng hợp số liệu thực tế trước khi đưa ra quyết định thuê. Ở bối cảnh, sự chú ý dồn vào việc phát hiện hoặc tránh bỏ sót các chi tiết bị che giấu. Hiện tại đòi hỏi thái độ chậm lại, ghi nhận từng hạng mục chi phí và hiện trạng vật lý như một cuộc khảo sát khách quan. Hướng đi nhấn mạnh việc dung hòa giữa ngân sách, sự tiện lợi và chất lượng sống để bạn dễ dàng so sánh nếu còn xem thêm các lựa chọn khác.",
  "themes": [
    "Minh bạch chi phí phát sinh",
    "Kiểm tra hiện trạng thực tế",
    "Tiêu chuẩn so sánh nhất quán",
    "Cân bằng ngân sách và nhu cầu"
  ],
  "perCard": [
    {
      "position": "Bối cảnh",
      "keyMessage": "Làm rõ những điều khoản ngầm hoặc thông tin chưa được bên cho thuê nêu trực tiếp.",
      "text": "Seven of Swords ngược gắn với việc phơi bày những điều mập mờ hoặc rũ bỏ sự che giấu. Tại bối cảnh buổi xem nhà đầu tiên, lá bài này hướng sự tập trung vào việc ghi lại các điều khoản hợp đồng chưa rõ, quy định chung của tòa nhà và các khoản phí dịch vụ ngoài tiền thuê cố định."
    },
    {
      "position": "Hiện tại",
      "keyMessage": "Tạm dừng để ghi chép và đo lường kỹ lưỡng từng giá trị vật chất của căn phòng.",
      "text": "Seven of Pentacles xuôi biểu trưng cho việc đứng lại đánh giá hoa lợi sau quá trình chăm sóc. Trong thời điểm khảo sát, điều này đại diện cho việc kiểm tra cẩn thận công tơ điện nước, áp lực nước, độ cách âm và độ hao mòn nội thất thay vì chỉ nhìn lướt qua vẻ ngoài."
    },
    {
      "position": "Hướng đi",
      "keyMessage": "Dung hòa các tiêu chí đối lập để tìm mức độ phù hợp dài hạn cho bản thân.",
      "text": "Temperance xuôi mang ý nghĩa điều hòa và kiên nhẫn phối hợp các yếu tố khác nhau. Với hướng đi so sánh căn hộ, lá bài gợi mở việc đặt các yếu tố chi phí, vị trí địa lý và mức độ tiện nghi lên cùng một thang đo để nhận diện căn hộ có độ tương thích tổng thể cao nhất."
    }
  ],
  "connections": "Hai lá số 7 kết nối trực tiếp sự thận trọng trước những điểm mờ với hành động đo đạc cụ thể ngay tại chỗ. Bối cảnh Seven of Swords ngược thúc đẩy nhu cầu tìm kiếm sự rõ ràng, trong khi Seven of Pentacles upright cung cấp phương pháp bằng việc dừng lại, ghi nhận hiện trạng vật lý và các số liệu có thể kiểm chứng. Khi kết hợp cùng Temperance ở hướng đi, trải bài tạo nên một quy trình kiểm tra thực tế: bóc tách thông tin ngầm, cân đo các thông số thực tế và dung hòa chúng với khả năng chi trả. Trục đối chiếu này giúp bạn tránh đưa ra quyết định vội vàng chỉ dựa vào ấn tượng bề ngoài, chuyển việc xem phòng thành một bài toán so sánh dựa trên các tiêu chí cân bằng.",
  "actionSuggestions": [
    "Lập bảng hỏi rõ ràng về các loại phí phát sinh ngoài tiền nhà, bao gồm giá điện nước tính theo đồng hồ riêng hay chung, phí dịch vụ, phí gửi xe và chi phí internet trong 7 ngày tới.",
    "Tạo danh mục kiểm tra tình trạng vận hành của thiết bị có sẵn bằng cách bật thử điều hòa, xả nước vòi sen, kiểm tra ổ cắm và chụp ảnh các vết hỏng hóc hiện có khi tới xem.",
    "Xây dựng thang điểm từ 1 đến 5 cho ba tiêu chí cốt lõi gồm khoảng cách di chuyển, độ yên tĩnh và mức độ thông thoáng để điền ngay sau khi kết thúc chuyến xem phòng."
  ],
  "reflectiveQuestion": "Khi đặt các thông số chi phí cố định và mức độ thuận tiện sinh hoạt cạnh nhau, tiêu chí nào là ranh giới bắt buộc bạn không thể thỏa hiệp?",
  "closingNote": "Các biểu tượng mở ra những góc nhìn để bạn chuẩn bị danh sách câu hỏi và tiêu chí kiểm tra thiết thực nhất trước buổi hẹn. Mọi quyết định thuê hay tiếp tục tìm kiếm hoàn toàn phụ thuộc vào việc thông tin thực tế có khớp với nhu cầu của bạn hay không. Bạn hãy tự tin dựa vào số liệu ghi nhận được để lựa chọn không gian sống phù hợp."
}
```

Điểm (0–2): grounding __ | specificity __ | connections __ | voice __ | actionability __

Lỗi: unsupported_claim __ | forced_relation __ | third_party_mindreading __ | safety_error __ | card_error __

Dẫn chứng/lý do: __

Ưu tiên (A/B/tie): A. Nhận xét: __
