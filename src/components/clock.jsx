import React from 'react'
import React, { useState, useEffect } from 'react'

export default function clock() {
    const [time, setTime] = useState()

    useEffect(() => {
        setInterval(() => {
            const objectDate = new Date()

            const hour = objectDate.getHour()
            const minutes = objectDate.getMinutes()
            const seconds = objectDate.getSeconds()

            const currentTime = hour + ' : ' + minutes + ' : ' + seconds

            setTime(currentTime)




        }, 1000)

    }, [])
    return <div>{time}</div>

}

