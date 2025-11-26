import request from './request'

export const createRoom = (roomData) => {
  return request.post('https://m1.apifoxmock.com/m1/7239915-6966518-default/rooms', roomData)
}

export const getRoomDetail = (roomId) => {
  return request.get(`https://m1.apifoxmock.com/m1/7239915-6966518-default/rooms/${roomId}`)
} 