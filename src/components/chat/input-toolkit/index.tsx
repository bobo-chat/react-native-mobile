import { Keyboard, View } from "react-native";
import React, { forwardRef, useEffect, useImperativeHandle, useState } from "react";
import crypto from "react-native-quick-crypto";
import { InputAccessoryItemType } from "./accessory";
import dayjs from "dayjs";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { DataType, IMessage } from "./types";
import { captureImage, captureVideo, pickerDocument, pickerImage } from "./utils";
import TextInput from "./text-input";
import Accessory from "./accessory";
import { globalStorage } from "@/lib/storage";
import util from '@/lib/utils'
import fileService from "@/service/file.service";
export interface InputToolKitRef {
    down: () => void;
}
export interface InputToolKitProps {
    tools: InputAccessoryItemType[];
    onSend: (message: IMessage<DataType>) => Promise<void>;
}
export default forwardRef((props: InputToolKitProps,ref) => {
    const { tools } = props;
    const insets = useSafeAreaInsets();
    const [mode, setMode] = useState<'text' | 'emoji' | 'tool' | 'normal'>('text');
    const [accessoryHeight, setAccessoryHeight] = useState<number>(0);
    const [keyboardState, setKeyboardState] = useState(false);
    useEffect(() => {
        const showSubscription = Keyboard.addListener("keyboardDidShow", (e) => {
            setAccessoryHeight(0);
            setKeyboardState(true);
            globalStorage.setItem('keyboardHeight', e.endCoordinates.height);
        });
        const hideSubscription = Keyboard.addListener("keyboardDidHide", () => {
            setKeyboardState(false);
        });
        return () => {
            showSubscription.remove();
            hideSubscription.remove();
        };
    }, []);
    useImperativeHandle(ref, () => ({
        down: () => {
            setAccessoryHeight(0);
            setMode('normal');
        }
    }));
    return <View style={{
        backgroundColor: "white",
        paddingBottom: !keyboardState ? insets.bottom : 0,
    }}>
        <TextInput mode={mode} onChangeMode={(v) => {
            if (v == 'text') {
                setAccessoryHeight(0);
            }else if(v == 'tool'){
                const height = globalStorage.getNumber('keyboardHeight') ?? 150;
                setAccessoryHeight(height);
            }
            setMode(v)
            console.log(v);
        }} tools={tools} onSend={props.onSend}/>
        <View style={{
            height: accessoryHeight,
            width: '100%',
        }}>
            {mode == 'tool' ? <Accessory tools={tools} onPress={async (tool) => {
                switch (tool.key) {
                    case 'camera':
                        const photo = await captureImage();
                        if(photo !== undefined){
                            const message: IMessage<'image'> = {
                                mid: util.generateId(),
                                type: 'image',
                                state: 0,
                                time: dayjs(),
                                data: {
                                    w: photo.width,
                                    h: photo.height,
                                    thumbnail: photo.uri,
                                    original: photo.uri,
                                    t_md5: '',
                                    o_md5: '',
                                    t_enc_md5: '',
                                    o_enc_md5: '',
                                },
                            }
                            await props.onSend(message)
                        }
                        break;
                    case 'video':
                        const video = await captureVideo();
                        if(video !== undefined){
                            const mid = util.generateId()
                            // 这里在未经解码的时候，使用最初的视频文件生成缩略图，可能会存在转码问题，留意
                            const originalThumbnailPath = await fileService.generateVideoThumbnail(video.uri,mid)
                            const message: IMessage<'video'> = {
                                mid: mid,
                                type: 'video',
                                state: 0,
                                time: dayjs(),
                                data: {
                                    w: video.width,
                                    h: video.height,
                                    thumbnail: originalThumbnailPath??'',
                                    original: video.uri,
                                    t_md5: '',
                                    o_md5: '',
                                    t_enc_md5: '',
                                    o_enc_md5: '',
                                    duration: video.duration??0
                                },
                            }
                            await props.onSend(message)
                        }
                           
                        break;
                    case 'albums':
                        const images = await pickerImage();
                        for (let i = 0; i < images.length; i++) {
                            const uri = images[i].uri;
                            const message: IMessage<'image'> = {
                                mid: util.generateId(),
                                type: 'image',
                                state: 0,
                                time: dayjs(),
                                data: {
                                    w: images[i].width,
                                    h: images[i].height,
                                    thumbnail: uri,
                                    original: uri,
                                    t_md5: '',
                                    o_md5: '',
                                    t_enc_md5: '',
                                    o_enc_md5: '',
                                },
                            }
                            await props.onSend(message)
                        }
                        break;
                    case 'file':
                        const assets =await pickerDocument();
                        for (let i = 0; i < assets.length; i++) {
                            const uri = assets[i].uri;
                            const message: IMessage<'file'> = {
                                mid: util.generateId(),
                                type: 'file',
                                state: 0,
                                time: dayjs(),
                                data: {
                                    mime: assets[i].mimeType ?? 'application/octet-stream',
                                    name: assets[i].name,
                                    size: assets[i].size ?? 0,
                                    path: uri,
                                    md5: '',
                                    enc_md5: '',
                                },
                            }
                            await props.onSend(message)
                        }
                        break;
                    default:
                        break;
                }
            }} height={accessoryHeight} /> : null}
        </View>
    </View>
});
