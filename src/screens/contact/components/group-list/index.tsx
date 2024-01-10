import { View } from "react-native"
import { scale, verticalScale } from "react-native-size-matters/extend"
import ListItem from "./list-item"
import { FlashList } from "@shopify/flash-list"
import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from "react"
import { FriendListItem } from "@/api/friend";
import AlphabetIndex from "./alphabet-index";
import MenuList from "./menu-list";

import group from "@/api/v2/group"
import groupService from "@/service/group-service"

export interface GroupListType {
    focus: () => void;
}
export default forwardRef((_,ref) => {
    const listRef = useRef<FlashList<any>>(null);
    const [contacts, setContacts] = useState<(FriendListItem)[]>([]);
    const [contactAlphabetIndex, setContactAlphabetIndex] = useState<{ [key: string]: number }>({});
    const [aplphabet, setAplphabet] = useState<string[]>([]);
    let fitem:FriendListItem = {
      uid: "string",
      gender: 1,
      name_index: "1",
      chat_id: "string",
      avatar: "123",
      pub_key: "321",
      name: "demo"
    }
    useImperativeHandle(ref, () => ({
        focus: () => {
          groupService.getList().then((d)=>{
            console.log(d);
          })            
        }
    }));
    return <View style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'row'
    }}>
        <View style={{
            flex: 1,
            paddingTop: verticalScale(15)
        }}>
            <View style={{
                flex: 1,
                flexDirection: 'row',
            }}>
                <FlashList
                    ListHeaderComponent={() => <MenuList />}
                    ref={listRef}
                    data={contacts}
                    renderItem={({ item, index }) => {
                        return <ListItem item={item} isLast={index === contacts.length - 1} />;
                    }}
                    estimatedItemSize={scale(60)}
                />
            </View>
        </View>
        <View style={{
            width: scale(32)
        }}>
            <AlphabetIndex alphabet={aplphabet} contactAlphabetIndex={contactAlphabetIndex} onScrollToIndex={(v) => {
                listRef.current?.scrollToIndex({
                    index: v,
                    animated: true,
                });
            }} />
        </View>

    </View>
});