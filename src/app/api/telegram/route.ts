import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { message } = body;

    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    const chatId = process.env.TELEGRAM_CHAT_ID;

    if (!botToken || !chatId) {
      return NextResponse.json(
        { error: 'Telegram 配置缺失' },
        { status: 500 }
      );
    }

    if (!message) {
      return NextResponse.json(
        { error: '消息内容不能为空' },
        { status: 400 }
      );
    }

    // 调用 Telegram Bot API
    const telegramApiUrl = `https://api.telegram.org/bot${botToken}/sendMessage`;
    
    const response = await fetch(telegramApiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        chat_id: chatId,
        text: message,
        parse_mode: 'HTML',
      }),
    });

    const data = await response.json();

    if (!response.ok || !data.ok) {
      console.error('Telegram API error:', data);
      return NextResponse.json(
        { error: '发送 Telegram 通知失败', details: data.description || '未知错误' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, messageId: data.result.message_id });
  } catch (error) {
    console.error('Telegram notification error:', error);
    return NextResponse.json(
      { error: '发送通知时发生错误', details: error instanceof Error ? error.message : '未知错误' },
      { status: 500 }
    );
  }
}

