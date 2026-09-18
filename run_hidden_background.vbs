Set http = CreateObject("MSXML2.ServerXMLHTTP.6.0")
Do
  On Error Resume Next
  http.Open "GET", "https://telegram-bot-maker-v2.onrender.com/webapp", False
  http.setRequestHeader "Bypass-Tunnel-Reminder", "true"
  http.Send
  On Error GoTo 0
  WScript.Sleep 150000 ' 2.5 daqiqada bir ping yuborib Render-ni 24/7 uyg'oq tutadi
Loop
