const fs = require('fs');
const path = require('path');

// 채널 정보가 저장될 파일 경로
const CHANNELS_FILE = path.join(__dirname, '../../channels.json');

/**
 * channels.json 파일을 읽어 배열을 반환한다.
 * 파일이 없거나 파싱 실패 시 빈 배열을 반환한다.
 * @returns {Array<{guildId:string, channelId:string}>}
 */
function readChannels() {
  try {
    const data = fs.readFileSync(CHANNELS_FILE, 'utf8');
    return JSON.parse(data);
  } catch (err) {
    return [];
  }
}

/**
 * 채널 배열을 channels.json에 저장한다.
 * @param {Array<{guildId:string, channelId:string}>} channels
 */
function writeChannels(channels) {
  fs.writeFileSync(CHANNELS_FILE, JSON.stringify(channels, null, 2));
}

module.exports = {
  CHANNELS_FILE,
  readChannels,
  writeChannels,
};
