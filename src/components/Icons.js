import React from 'react';
import { Svg, Path, Circle, G, Ellipse } from 'react-native-svg';

export const SettingsIcon = ({ size = 24, color = "#FFCE6A" }) => (
    <Svg width={size} height={size} viewBox="0 0 48 48" fill="none">
        <Path d="M26.2222 17.3127C25.5167 17.1091 24.7711 17 24 17C19.5817 17 16 20.5817 16 25C16 29.4183 19.5817 33 24 33C28.4183 33 32 29.4183 32 25C32 23.5429 31.6104 22.1767 30.9297 21" stroke={color} strokeWidth="2.5" strokeLinecap="round" />
        <Path d="M13.5 31.9424C14.3564 32.1381 14.9638 32.9 14.9638 33.7785V37.928C14.9638 40.4992 17.9865 41.879 19.9291 40.1946L21.9747 38.4209C23.1282 37.4208 24.8489 37.4464 25.9721 38.4805L27.7585 40.1253C29.6363 41.8542 32.678 40.5975 32.7878 38.0474L32.936 34.6044C32.995 33.235 33.9746 32.0797 35.316 31.7976L38.7725 31.0709C41.3352 30.5321 42.0258 27.1985 39.888 25.686L37.2943 23.851C36.1185 23.0192 35.6998 21.4693 36.2967 20.1586L37.9369 16.5571C39.0532 14.106 36.6244 11.5396 34.1156 12.5192L31.7843 13.4294C30.2507 14.0282 28.5211 13.2792 27.9085 11.7511L26.7846 8.94712C25.7778 6.43535 22.2222 6.43535 21.2154 8.94712L19.96 12.0791C19.4016 13.472 17.8999 14.2381 16.4444 13.8725L13.5048 13.1341C10.9902 12.5024 8.91251 15.1427 10.1177 17.4382L11.5701 20.2044C12.2432 21.4865 11.9045 23.0663 10.7651 23.9598L7.53614 26.4917C5.91706 27.7612 6.49428 30.3409 8.5 30.7994" stroke={color} strokeWidth="2.5" strokeLinecap="round" />
    </Svg>
);



export const PeopleIcon = ({ size = 24, color = "#FFCE6A" }) => (
    <Svg width={size} height={size} viewBox="0 0 48 48" fill="none">
        <Path d="M15 36.6187V40.084C15 41.4615 15.9377 42.6723 17.2849 42.9594C22.2442 44.0161 25.7738 44.0474 30.7373 42.9688C32.0745 42.6782 33 41.4719 33 40.1036V36.6187C33 32.3804 31.6536 28.2517 29.155 24.8282L28.8465 24.4055C26.4499 21.1217 21.5501 21.1217 19.1535 24.4055L18.845 24.8282C16.3464 28.2517 15 32.3804 15 36.6187Z" stroke={color} strokeWidth="2.5" />
        <Circle cx="24" cy="13.7649" r="5.25" stroke={color} strokeWidth="2.5" />
        <Path d="M34 25.6711L34.5233 24.9163C36.2794 22.3834 40.0017 22.3174 41.8464 24.7866C42.9397 26.25 43.7572 27.9002 44.259 29.6566L44.5 30.5" stroke={color} strokeWidth="2.5" strokeLinecap="round" />
        <Path d="M45 36.5V37.391C45 38.7452 44.0958 39.9482 42.7715 40.2308C40.3623 40.7449 38.3751 40.8836 36.2115 40.6653" stroke={color} strokeWidth="2.5" strokeLinecap="round" />
        <Circle cx="37.5" cy="16.2649" r="3.75" stroke={color} strokeWidth="2.5" />
        <Path d="M5 29.5L4.49419 30.6381C3.50903 32.8547 3 35.2533 3 37.679C3 38.861 3.79527 39.9052 4.94997 40.1579C7.24796 40.661 9.15205 40.8555 11.1608 40.7259" stroke={color} strokeWidth="2.5" strokeLinecap="round" />
        <Path d="M8 24L8.35526 23.6447C9.31161 22.6884 10.81 22.54 11.9354 23.2902C12.6363 23.7575 13.2244 24.3751 13.657 25.098L14 25.6711" stroke={color} strokeWidth="2.5" strokeLinecap="round" />
        <Circle cx="10.5" cy="16.2649" r="3.75" stroke={color} strokeWidth="2.5" />
    </Svg>
);

export const CardsIcon = ({ size = 24, color = "#FED16A" }) => (
    <Svg width={size} height={size} viewBox="0 0 48 48" fill="none">
        <Path d="M23 13.5V12C23 10.3431 21.6569 9 20 9H10C8.34315 9 7 10.3431 7 12V22.5" stroke={color} strokeWidth="2.5" strokeLinecap="round" />
        <Path d="M23 19.5V30C23 31.6569 21.6569 33 20 33H10C8.34315 33 7 31.6569 7 30V28.5" stroke={color} strokeWidth="2.5" strokeLinecap="round" />
        <Path d="M33.4571 18.4435L33.9843 16.9048C34.5051 15.385 33.7361 13.7246 32.24 13.1389L25.5 10.5" stroke={color} strokeWidth="2.5" strokeLinecap="round" />
        <Path d="M31.7244 23.5L28.0466 34.2332C27.5343 35.7282 25.9501 36.5695 24.4246 36.1565L22 35.5" stroke={color} strokeWidth="2.5" strokeLinecap="round" />
        <Path d="M36.5 17.5L42.8686 23.5256C44.1049 24.6954 44.1215 26.6583 42.9052 27.8488L41.9171 28.8158" stroke={color} strokeWidth="2.5" strokeLinecap="round" />
        <Path d="M38 32.6496L30.0944 40.3872C28.9224 41.5342 27.0465 41.5277 25.8826 40.3723L24.5 39" stroke={color} strokeWidth="2.5" strokeLinecap="round" />
        <Path d="M12 25L13 22M18 25L17 22M13 22L14.0385 18.3653C14.3148 17.3983 15.6852 17.3983 15.9615 18.3653L17 22M13 22H17" stroke={color} strokeWidth="2.5" strokeLinecap="round" />
    </Svg>
);

export const CrownIcon = ({ size = 24, color = "#FED16A" }) => (
    <Svg width={size} height={size} viewBox="0 0 48 48" fill="none">
        <Path d="M8 25.5C8.69494 27.9277 9.56262 31.7582 9.60153 34.4428C9.61574 35.4226 9.96916 36.3617 10.8965 36.6785C12.5942 37.2585 16.1934 38 23.5 38C30.7002 38 34.6602 37.28 36.6761 36.704C37.8222 36.3765 38.3599 35.2345 38.4099 34.0437C38.5213 31.3893 39.3388 27.8097 40 25.5M12 33C12 33 13.5 34 23.7887 34C34.0774 34 36 33 36 33" stroke={color} strokeWidth="2.5" strokeLinecap="round" />
        <Path d="M20.5 20.5C19.8393 24.1336 18.3323 29.0945 14.7938 28.0371C13.2634 27.5798 11.6317 26.3986 10 25" stroke={color} strokeWidth="2.5" strokeLinecap="round" />
        <Path d="M27.5 20.5C28.1607 24.1336 29.6677 29.0945 33.2062 28.0371C34.7366 27.5798 36.3683 26.3986 38 25" stroke={color} strokeWidth="2.5" strokeLinecap="round" />
        <Path d="M23.3955 10.1592C23.4703 9.92885 23.7963 9.92885 23.8711 10.1592L24.5811 12.3447C24.6948 12.6949 25.0214 12.9326 25.3896 12.9326H27.6885C27.9304 12.9329 28.0308 13.2425 27.835 13.3848L25.9756 14.7354C25.6777 14.9518 25.5532 15.3363 25.667 15.6865L26.377 17.8721C26.4518 18.1024 26.1881 18.2937 25.9922 18.1514L24.1328 16.8008L24.0166 16.7295C23.776 16.6077 23.4907 16.6079 23.25 16.7295L23.1328 16.8008L21.2734 18.1514C21.0775 18.2937 20.8138 18.1024 20.8887 17.8721L21.5996 15.6865C21.7134 15.3363 21.5879 14.9518 21.29 14.7354L19.4307 13.3848C19.2347 13.2424 19.3359 12.9326 19.5781 12.9326H21.876C22.2442 12.9326 22.5708 12.695 22.6846 12.3447L23.3955 10.1592Z" stroke={color} strokeWidth="2.5" />
        <Circle cx="7.55274" cy="21.0527" r="2.25" transform="rotate(1.01642 7.55274 21.0527)" stroke={color} strokeWidth="2.5" />
        <Circle cx="40.0527" cy="21.0527" r="2.25" transform="rotate(1.01642 40.0527 21.0527)" stroke={color} strokeWidth="2.5" />
    </Svg>
);

export const DoorClosedIcon = ({ size = 24, color = "#FFCE6A" }) => (
    <Svg width={size} height={size} viewBox="0 0 48 48" fill="none">
        <Path d="M15.5 24.2442V14C15.5 12.3431 16.8431 11 18.5 11H27C28.6569 11 30 12.3431 30 14V39.5C30 41.1569 28.6569 42.5 27 42.5H18.5C16.8431 42.5 15.5 41.1569 15.5 39.5V30.5" stroke={color} strokeWidth="2.5" strokeLinecap="round" />
        <Path d="M34 11.5C34 9.01472 31.9853 7 29.5 7H17C13.9624 7 11.5 9.46243 11.5 12.5V42.5" stroke={color} strokeWidth="2.5" strokeLinecap="round" />
        <Path d="M34 17.731V42.5" stroke={color} strokeWidth="2.5" strokeLinecap="round" />
        <Circle cx="27" cy="25" r="1" fill={color} />
    </Svg>
);

export const RulesIcon = ({ size = 24, color = "#FFCE6A" }) => (
    <Svg width={size} height={size} viewBox="0 0 48 48" fill="none">
        <Path d="M16 21H29.5M16 26.5H29.5M16 32.5H29.5" stroke={color} strokeWidth="2.5" strokeLinecap="round" />
        <Path d="M11.5 34.5V35.5C11.5 37.1569 12.8431 38.5 14.5 38.5H32.5" stroke={color} strokeWidth="2.5" strokeLinecap="round" />
        <Path d="M11.5 28.2677V18.5" stroke={color} strokeWidth="2.5" strokeLinecap="round" />
        <Path d="M34 16.8134V13C34 11.3431 32.6569 10 31 10C29.3431 10 28 11.3431 28 13C28 14.6569 26.6569 16 25 16H11.5H10C8.34315 16 7 14.6569 7 13C7 11.3431 8.34315 10 10 10H26.5" stroke={color} strokeWidth="2.5" strokeLinecap="round" />
        <Path d="M34 22.7819V32.5V35.5C34 37.1569 35.3431 38.5 37 38.5C38.6569 38.5 40 37.1569 40 35.5C40 33.8431 38.6569 32.5 37 32.5H36.5" stroke={color} strokeWidth="2.5" strokeLinecap="round" />
    </Svg>
);

export const PaletteIcon = ({ size = 24, color = "#FFCE6A" }) => (
    <Svg width={size} height={size} viewBox="0 0 48 48" fill="none">
        <Path d="M40.631 11C38.5093 8.80103 35.8706 7.68335 33.5 7.23836" stroke={color} strokeWidth="2.5" strokeLinecap="round" />
        <Path d="M26.5 7C18.7019 7.3003 15.8267 8.83162 12.5 10.5C2.04755 15.7421 1.86304 26.3016 10 35" stroke={color} strokeWidth="2.5" strokeLinecap="round" />
        <Path d="M15 38.4498C17.6028 39.6423 20.4639 40.3596 23.5 40.6642" stroke={color} strokeWidth="2.5" strokeLinecap="round" />
        <Path d="M35.5 40.0026C36.3922 39.8355 37.2894 39.6446 38.1902 39.431C42.2121 38.4775 46.0931 34.1827 43.66 30.8415C42.8878 29.7811 41.694 29.328 40 29.1366" stroke={color} strokeWidth="2.5" strokeLinecap="round" />
        <Path d="M30 26C29.5 25.5 29.5 24.5 30 23.5C30.5 22.5 31.5 22 33 21.5" stroke={color} strokeWidth="2.5" strokeLinecap="round" />
        <Path d="M26.5348 40.5637L32.5911 26.2958C33.1845 24.8978 34.7989 24.2455 36.197 24.839C37.595 25.4324 38.2473 27.0468 37.6539 28.4449L31.5975 42.7127C31.0041 44.1107 29.3897 44.763 27.9916 44.1696C26.5936 43.5761 25.9413 41.9617 26.5348 40.5637Z" stroke={color} strokeWidth="2.5" />
        <Path d="M42.7432 15.0359C42.581 17.0637 42.1393 19.0608 41.2256 21.3908C40.6755 22.7934 39.0934 23.4468 37.6655 22.9662C35.8077 22.3409 35.0148 20.0561 36.5506 18.838C36.8695 18.5851 37.2207 18.3366 37.6071 18.1004C38.1334 17.7787 38.5974 17.3504 38.8877 16.8061C39.3383 15.961 39.7012 15.249 40.0193 14.5777C40.713 13.1135 42.8724 13.4208 42.7432 15.0359Z" stroke={color} strokeWidth="2.5" />
        <Path d="M19.5736 32.811C20.4017 32.8254 21.116 33.0791 21.602 33.4392C22.0894 33.8004 22.2994 34.2235 22.2927 34.6087C22.286 34.9939 22.0613 35.4094 21.5617 35.7533C21.0633 36.0963 20.3406 36.3249 19.5126 36.3104C18.6845 36.296 17.9702 36.0423 17.4841 35.6822C16.9968 35.321 16.7868 34.8979 16.7935 34.5127C16.8002 34.1275 17.0249 33.712 17.5245 33.3681C18.0229 33.0251 18.7456 32.7965 19.5736 32.811Z" stroke={color} strokeWidth="2.5" />
        <Path d="M12.524 26.8717C13.3517 26.8428 14.0783 27.0587 14.5826 27.3929C15.0881 27.7281 15.32 28.1397 15.3334 28.5247C15.3469 28.9096 15.1443 29.3364 14.6633 29.706C14.1836 30.0746 13.4739 30.3407 12.6462 30.3696C11.8185 30.3985 11.0919 30.1825 10.5877 29.8483C10.0821 29.5131 9.85024 29.1016 9.83679 28.7166C9.82335 28.3316 10.026 27.9049 10.5069 27.5353C10.9866 27.1667 11.6963 26.9006 12.524 26.8717Z" stroke={color} strokeWidth="2.5" />
        <Path d="M10.5126 18.811C11.3406 18.7965 12.0633 19.0251 12.5617 19.3681C13.0613 19.712 13.286 20.1275 13.2927 20.5127C13.2994 20.8979 13.0894 21.321 12.602 21.6822C12.116 22.0423 11.4017 22.296 10.5736 22.3104C9.74556 22.3249 9.02286 22.0963 8.52454 21.7533C8.0249 21.4094 7.80024 20.9939 7.79352 20.6087C7.78679 20.2235 7.99682 19.8004 8.48415 19.4392C8.97019 19.0791 9.68448 18.8254 10.5126 18.811Z" stroke={color} strokeWidth="2.5" />
        <Path d="M16.524 12.8717C17.3517 12.8428 18.0783 13.0587 18.5825 13.3929C19.0881 13.7281 19.32 14.1397 19.3334 14.5247C19.3469 14.9096 19.1443 15.3364 18.6633 15.706C18.1836 16.0746 17.4739 16.3407 16.6462 16.3696C15.8185 16.3985 15.0919 16.1825 14.5877 15.8483C14.0821 15.5131 13.8502 15.1016 13.8368 14.7166C13.8233 14.3316 14.026 13.9049 14.5069 13.5353C14.9866 13.1667 15.6963 12.9006 16.524 12.8717Z" stroke={color} strokeWidth="2.5" />
        <Path d="M30.986 12.2226C32.8756 11.9906 34.2859 13.0579 34.4342 14.2629C34.5821 15.4681 33.472 16.8457 31.5821 17.0777C29.6922 17.3098 28.2818 16.2417 28.1338 15.0365C27.9862 13.8314 29.0963 12.4546 30.986 12.2226Z" stroke={color} strokeWidth="2.5" />
    </Svg>
);

export const LinkIcon = ({ size = 24, color = "#FFCE6A" }) => (
    <Svg width={size} height={size} viewBox="0 0 48 48" fill="none">
        <Path d="M25 23L23.284 21.3209C22.1089 20.171 20.2272 20.1812 19.0646 21.3438L11.0234 29.385C9.85186 30.5565 9.85186 32.456 11.0234 33.6276L11.5495 34.1537C12.7211 35.3252 14.6206 35.3252 15.7921 34.1537L18.4458 31.5" stroke={color} strokeWidth="2.5" strokeLinecap="round" />
        <Path d="M8 27L7.07297 27.9653C4.81034 30.3212 4.84805 34.0542 7.15779 36.364L7.98546 37.1916L8.72827 37.9345C11.0714 40.2776 14.8704 40.2776 17.2136 37.9345L21.0847 34.0633" stroke={color} strokeWidth="2.5" strokeLinecap="round" />
        <Path d="M27.6662 25.6858C29.6672 24.284 29.9193 21.4161 28.1934 19.6867L26.1055 17.5946C23.7631 15.2474 19.9607 15.2454 17.6159 17.5903L12.5 22.7062" stroke={color} strokeWidth="2.5" strokeLinecap="round" />
        <Path d="M30.5 17.5L32.8388 15.0887C34.0049 13.8865 35.9294 13.8718 37.1136 15.0561L37.607 15.5495C38.7786 16.7211 38.7786 18.6206 37.607 19.7921L29.779 27.6201C28.5357 28.8634 26.4947 28.7758 25.3625 27.4306L25 27" stroke={color} strokeWidth="2.5" strokeLinecap="round" />
        <Path d="M27.8629 15L31.6202 11.2426C33.9634 8.89949 37.7624 8.8995 40.1055 11.2426L41.5911 12.7283C43.9343 15.0714 43.9343 18.8704 41.5911 21.2136L41 21.8047" stroke={color} strokeWidth="2.5" strokeLinecap="round" />
        <Path d="M21.3087 23.8087C19.445 25.3619 19.3172 28.1801 21.0327 29.8956L21.9855 30.8483L22.7698 31.6327C25.0967 33.9595 28.8635 33.978 31.2131 31.6742L37 26" stroke={color} strokeWidth="2.5" strokeLinecap="round" />
    </Svg>
);

export const OpenDoorIcon = ({ size = 24, color = "#FFCE6A" }) => (
    <Svg width={size} height={size} viewBox="0 0 48 48" fill="none">
        <Path d="M15.5 24.2442V14.1894C15.5 12.2865 17.2489 10.8644 19.1119 11.2525L25.1119 12.5025C26.503 12.7923 27.5 14.0184 27.5 15.4394V35.921C27.5 37.1715 26.7243 38.2909 25.5534 38.73L19.5534 40.98C17.5921 41.7155 15.5 40.2656 15.5 38.171V30.5" stroke={color} strokeWidth="2.5" strokeLinecap="round" />
        <Path d="M34 11.5V10C34 8.34315 32.6569 7 31 7H14.5C12.8431 7 11.5 8.34315 11.5 10V42.5" stroke={color} strokeWidth="2.5" strokeLinecap="round" />
        <Path d="M34 17.731V42.5" stroke={color} strokeWidth="2.5" strokeLinecap="round" />
        <Ellipse cx="24.75" cy="25" rx="0.75" ry="1" fill={color} />
    </Svg>
);

export const TrashIcon = ({ size = 24, color = "#ef4444" }) => (
    <Svg width={size} height={size} viewBox="0 0 48 48" fill="none">
        <Path d="M12 15.5L13.7884 38.3015C13.9086 39.8346 15.1686 41.0285 16.706 41.066L31.7331 41.4325C33.2959 41.4706 34.6261 40.3022 34.7897 38.7475L34.8998 37.7016" stroke={color} strokeWidth="2.5" strokeLinecap="round" />
        <Path d="M18 9.5H38.25C39.2165 9.5 40 10.2835 40 11.25C40 12.2165 39.2165 13 38.25 13H37.5H12H11.25C10.2835 13 9.5 12.2165 9.5 11.25C9.5 10.2835 10.2835 9.5 11.25 9.5H12" stroke={color} strokeWidth="2.5" strokeLinecap="round" />
        <Path d="M37 15.5L35.5526 31.5" stroke={color} strokeWidth="2.5" strokeLinecap="round" />
        <Path d="M16.5 41L35.5 23" stroke={color} strokeWidth="2.5" strokeLinecap="round" />
        <Path d="M14 38L36.5 16" stroke={color} strokeWidth="2.5" strokeLinecap="round" />
        <Path d="M14 32.5L31.5 15.5" stroke={color} strokeWidth="2.5" strokeLinecap="round" />
        <Path d="M13.5 27.5L26.5 15.5" stroke={color} strokeWidth="2.5" strokeLinecap="round" />
        <Path d="M13 22.5L20.5 15.5" stroke={color} strokeWidth="2.5" strokeLinecap="round" />
        <Path d="M13 17.5L15 15.5" stroke={color} strokeWidth="2.5" strokeLinecap="round" />
        <Path d="M22 41.5L36 27.5" stroke={color} strokeWidth="2.5" />
        <Path d="M27.5 41.5L33.5 35" stroke={color} strokeWidth="2.5" strokeLinecap="round" />
        <Path d="M24 15.5L35.5 26.5" stroke={color} strokeWidth="2.5" strokeLinecap="round" />
        <Path d="M17 15.5L33 30.5" stroke={color} strokeWidth="2.5" strokeLinecap="round" />
        <Path d="M13 17L33 35.5" stroke={color} strokeWidth="2.5" strokeLinecap="round" />
        <Path d="M13 22.5L33.5 41" stroke={color} strokeWidth="2.5" strokeLinecap="round" />
        <Path d="M13.5 28L28 41" stroke={color} strokeWidth="2.5" strokeLinecap="round" />
        <Path d="M14 34L22 41" stroke={color} strokeWidth="2.5" strokeLinecap="round" />
        <Path d="M14 38.5L16.5 41" stroke={color} strokeWidth="2.5" strokeLinecap="round" />
        <Path d="M29.5 15.5L36 22" stroke={color} strokeWidth="2.5" strokeLinecap="round" />
        <Path d="M35.5 15.5L36.5 16" stroke={color} strokeWidth="2.5" strokeLinecap="round" />
    </Svg>
);

export const RobotIcon = ({ size = 24, color = "#FFCE6A" }) => (
    <Svg width={size} height={size} viewBox="0 0 48 48" fill="none">
        <Path d="M17 30V31.5V32.0917C17 32.6839 17.2036 33.2661 17.7621 33.4633C20.3773 34.3867 28.3905 34.3437 30.1655 33.3342C30.4458 33.1748 30.5 32.8356 30.5 32.5132V31.5V30" stroke={color} strokeWidth="2.5" strokeLinecap="round" />
        <Path d="M18.5 13H30M18.5 13H13.5C11.8431 13 10.5 14.3431 10.5 16M18.5 13C18.5 11.3431 19.8431 10 21.5 10H23H27C28.6569 10 30 11.3431 30 13M30 13H34C35.6569 13 37 14.3431 37 16M37 16H37.5C39.1569 16 40.5 17.3431 40.5 19V22C40.5 23.6569 39.1569 25 37.5 25H37M37 16V25M37 25C37 26.3807 35.8807 27.5 34.5 27.5H30.5H17H13C11.6193 27.5 10.5 26.3807 10.5 25M10.5 25V23M10.5 25H10C8.34315 25 7 23.6569 7 22V19C7 17.3431 8.34315 16 10 16H10.5M10.5 16.5V16" stroke={color} strokeWidth="2.5" strokeLinecap="round" />
        <Path d="M39 40V40.1151C39 41.0213 38.6822 41.8923 37.8187 42.1672C32.7049 43.7949 13.3295 43.7774 8.52277 42.1146C7.77053 41.8544 7.5 41.0795 7.5 40.2835V38.5C7.5 34.634 10.634 31.5 14.5 31.5" stroke={color} strokeWidth="2.5" strokeLinecap="round" />
        <Path d="M38.5 34.5C37.5531 32.9219 35.9332 31.8667 34.107 31.6384L33 31.5" stroke={color} strokeWidth="2.5" strokeLinecap="round" />
        <Path d="M24.5 5.75C25.1904 5.75 25.75 6.30964 25.75 7C25.75 7.69036 25.1904 8.25 24.5 8.25C23.8096 8.25 23.25 7.69036 23.25 7C23.25 6.30964 23.8096 5.75 24.5 5.75Z" stroke={color} strokeWidth="2.5" />
        <Circle cx="19" cy="19" r="2.25" stroke={color} strokeWidth="2.5" />
        <Circle cx="29.5" cy="19" r="2.25" stroke={color} strokeWidth="2.5" />
        <Path d="M21 24C22.5 25.5 25.5 25.5 27 24" stroke={color} strokeWidth="2.5" strokeLinecap="round" />
    </Svg>
);

export const ErrorIcon = ({ size = 24, color = "#FFCE6A" }) => (
    <Svg width={size} height={size} viewBox="0 0 48 48" fill="none">
        <Path d="M37.2093 39.5H38.7224C41.0318 39.5 42.4752 37 41.3205 35L26.5981 9.5C25.4434 7.5 22.5566 7.5 21.4019 9.5L20.2472 11.5" stroke={color} strokeWidth="2.5" strokeLinecap="round" />
        <Path d="M31 39.5H9.26322C6.95701 39.5 5.51324 37.0062 6.66156 35.0062L17 17" stroke={color} strokeWidth="2.5" strokeLinecap="round" />
        <Path d="M24.948 27.6746L26.1561 18.9762C26.3378 17.6675 25.3213 16.5 24 16.5C22.6787 16.5 21.6622 17.6675 21.8439 18.9762L23.052 27.6746C23.1177 28.1478 23.5223 28.5 24 28.5C24.4777 28.5 24.8823 28.1477 24.948 27.6746Z" stroke={color} strokeWidth="2.5" />
        <Path d="M24 31.75C24.9665 31.75 25.75 32.5335 25.75 33.5C25.75 34.4665 24.9665 35.25 24 35.25C23.0335 35.25 22.25 34.4665 22.25 33.5C22.25 32.5335 23.0335 31.75 24 31.75Z" stroke={color} strokeWidth="2.5" />
    </Svg>
);

export const RankIcon = ({ size = 24, color = "#FFCE6A" }) => (
    <Svg width={size} height={size} viewBox="0 0 48 48" fill="none">
        <Path d="M17.5 20V18.5C17.5 16.8431 18.8431 15.5 20.5 15.5L27 15.5C28.6569 15.5 30 16.8431 30 18.5V41.5C30 43.1569 28.6569 44.5 27 44.5H20.5C18.8431 44.5 17.5 43.1569 17.5 41.5V26.5" stroke={color} strokeWidth="2.5" strokeLinecap="round" />
        <Path d="M46 39.5V41C46 42.6569 44.6569 44 43 44H36C34.3431 44 33 42.6569 33 41V26C33 24.3431 34.3431 23 36 23L43 23C44.6569 23 46 24.3431 46 26V32.5" stroke={color} strokeWidth="2.5" strokeLinecap="round" />
        <Path d="M12 44H5C3.34315 44 2 42.6569 2 41V34C2 32.3431 3.34315 31 5 31H12C13.6569 31 15 32.3431 15 34V41C15 42.6569 13.6569 44 12 44Z" stroke={color} strokeWidth="2.5" />
        <Path d="M23.5245 2.46353C23.6741 2.00287 24.3259 2.00287 24.4755 2.46353L25.3471 5.1459C25.414 5.35191 25.606 5.49139 25.8226 5.49139H28.643C29.1274 5.49139 29.3288 6.1112 28.9369 6.3959L26.6552 8.0537C26.4799 8.18102 26.4066 8.4067 26.4735 8.61271L27.3451 11.2951C27.4948 11.7557 26.9675 12.1388 26.5757 11.8541L24.2939 10.1963C24.1186 10.069 23.8814 10.069 23.7061 10.1963L21.4243 11.8541C21.0325 12.1388 20.5052 11.7557 20.6549 11.2951L21.5265 8.61271C21.5934 8.4067 21.5201 8.18102 21.3448 8.0537L19.0631 6.3959C18.6712 6.1112 18.8726 5.49139 19.357 5.49139H22.1774C22.394 5.49139 22.586 5.35191 22.6529 5.1459L23.5245 2.46353Z" stroke={color} strokeWidth="2.5" />
    </Svg>
);

export const SkipIcon = ({ size = 24, color = "#FFCE6A" }) => (
    <Svg width={size} height={size} viewBox="0 0 48 48" fill="none">
        <Path d="M26.5 33L25.9804 33.5196C25.6728 33.8272 25.2556 34 24.8206 34C23.3795 34 22.6389 32.2749 23.6314 31.2301L29.8457 24.6887C30.2124 24.3028 30.2124 23.6972 29.8457 23.3113L23.617 16.7548C22.6299 15.7157 23.3665 14 24.7997 14C25.2468 14 25.6744 14.1835 25.9823 14.5077L32.9861 21.8801C34.1066 23.0596 34.0828 24.9172 32.9324 26.0676L30 29" stroke={color} strokeWidth="2.5" strokeLinecap="round" />
        <Path d="M20.5 19L23.1442 21.9381C24.1918 23.102 24.1679 24.8759 23.0894 26.0112L15.9823 33.4923C15.6744 33.8165 15.2468 34 14.7997 34C13.3665 34 12.6299 32.2843 13.617 31.2452L19.8457 24.6887C20.2124 24.3028 20.2124 23.6972 19.8457 23.3113L13.6314 16.7699C12.6389 15.7251 13.3795 14 14.8206 14C15.2556 14 15.6728 14.1728 15.9804 14.4804L16.5 15" stroke={color} strokeWidth="2.5" strokeLinecap="round" />
    </Svg>
);

export const EyeIcon = ({ size = 24, color = "#FFCE6A" }) => (
    <Svg width={size} height={size} viewBox="0 0 48 48" fill="none">
        <Path d="M7 26C8.58039 24.8293 10.0743 23.795 11.5 22.8972" stroke={color} strokeWidth="2.5" strokeLinecap="round" />
        <Path d="M17.7326 19.6979C25.2619 16.8732 31.3729 18.9552 40 26" stroke={color} strokeWidth="2.5" strokeLinecap="round" />
        <Path d="M7 26C16.6713 33.1639 23.1029 35.2235 30.5 32.1189" stroke={color} strokeWidth="2.5" strokeLinecap="round" />
        <Path d="M36 29.0255C37.2787 28.1463 38.6066 27.1379 40 26" stroke={color} strokeWidth="2.5" strokeLinecap="round" />
        <Path d="M29.8149 22.1016C30.5633 23.2158 31 24.5569 31 26C31 27.2032 30.6964 28.3355 30.1617 29.3244" stroke={color} strokeWidth="2.5" strokeLinecap="round" />
        <Path d="M18.0682 29.7184C17.3914 28.641 17 27.3662 17 26C17 24.4933 17.476 23.0979 18.2858 21.9557" stroke={color} strokeWidth="2.5" strokeLinecap="round" />
        <Circle cx="24" cy="26" r="3" fill={color} />
    </Svg>
);

export const EyeOffIcon = ({ size = 24, color = "#FFCE6A" }) => (
    <Svg width={size} height={size} viewBox="0 0 48 48" fill="none">
        <Path d="M7 18.4796C8.58039 19.6503 10.0743 20.6847 11.5 21.5825" stroke={color} strokeWidth="2.5" strokeLinecap="round" />
        <Path d="M17.7326 24.7817C25.2619 27.6065 31.3729 25.5245 40 18.4796" stroke={color} strokeWidth="2.5" strokeLinecap="round" />
    </Svg>
);

export const LockIcon = ({ size = 24, color = "#FFCE6A" }) => (
    <Svg width={size} height={size} viewBox="0 0 48 48" fill="none">
        <Path d="M30 14.2647V12.5C30 9.18629 27.3137 6.5 24 6.5C20.6863 6.5 18 9.18629 18 12.5V14.2647" stroke={color} strokeWidth="2.5" strokeLinecap="round" />
        <Path d="M36.5 21.5V19.9623C36.5 18.3054 35.1569 16.9623 33.5 16.9623H30H18H15.3264C13.6695 16.9623 12.3264 18.3054 12.3264 19.9623L12.3264 30" stroke={color} strokeWidth="2.5" strokeLinecap="round" />
        <Path d="M36.5 27.5V37C36.5 38.6569 35.1569 40 33.5 40H15.3264C13.6695 40 12.3264 38.6569 12.3264 37V36" stroke={color} strokeWidth="2.5" strokeLinecap="round" />
        <Circle cx="24" cy="26" r="2.25" stroke={color} strokeWidth="2.5" />
        <Path d="M22.8 30.748V34.75C22.8 35.4404 23.3596 36 24.05 36C24.7404 36 25.3 35.4404 25.3 34.75V30.748" stroke={color} strokeWidth="2.5" strokeLinecap="round" />
    </Svg>
);

export const DiceIcon = ({ size = 24, color = "#FFCE6A" }) => (
    <Svg width={size} height={size} viewBox="0 0 48 48" fill="none">
        <Path d="M39.5 26L39.573 17.7497C39.5825 16.6685 39.0095 15.6657 38.0731 15.1251L25.5 7.86603C24.5718 7.33013 23.4282 7.33013 22.5 7.86603L9.91154 15.134C8.98334 15.6699 8.41154 16.6603 8.41154 17.7321V32.2679C8.41154 33.3397 8.98334 34.3301 9.91154 34.866L22.5 42.134C23.4282 42.6699 24.5718 42.6699 25.5 42.134L38.2894 34.75C39.0933 34.2859 39.5885 33.4282 39.5885 32.5" stroke={color} strokeWidth="2.5" strokeLinecap="round" />
        <Path d="M9.5 16L10.8297 16.8253" stroke={color} strokeWidth="2.5" strokeLinecap="round" />
        <Path d="M16 20L22.4155 24.0097C23.3855 24.6159 24.6157 24.6178 25.5876 24.0146L38.5 16" stroke={color} strokeWidth="2.5" strokeLinecap="round" />
        <Path d="M24 41.5V24.5" stroke={color} strokeWidth="2.5" strokeLinecap="round" />
        <Ellipse cx="15.9368" cy="29.2867" rx="1.89231" ry="2.24452" transform="rotate(-1.14463 15.9368 29.2867)" fill={color} />
        <Ellipse cx="36.0296" cy="22.3571" rx="2.13959" ry="1.75689" transform="rotate(97.7569 36.0296 22.3571)" fill={color} />
        <Ellipse cx="17.6256" cy="16.2078" rx="1.64916" ry="2.25852" transform="rotate(88 17.6256 16.2078)" fill={color} />
        <Ellipse cx="31.2841" cy="16.2225" rx="1.68386" ry="2.22665" transform="rotate(89 31.2841 16.2225)" fill={color} />
        <Ellipse cx="28.0201" cy="35.3498" rx="2.13959" ry="1.75689" transform="rotate(97.4678 28.0201 35.3498)" fill={color} />
        <Ellipse cx="32.0021" cy="29.3358" rx="2.13959" ry="1.75689" transform="rotate(96.9266 32.0021 29.3358)" fill={color} />
    </Svg>
);
export const InfoIcon = ({ size = 24, color = "#FFCE6A" }) => (
    <Svg width={size} height={size} viewBox="0 0 48 48" fill="none">
        <Circle cx="24" cy="24" r="21.5" stroke={color} strokeWidth="2.5" />
        <Path d="M24 22V34" stroke={color} strokeWidth="2.5" strokeLinecap="round" />
        <Circle cx="24" cy="14" r="2.5" fill={color} />
    </Svg>
);

export const ScaleIcon = ({ size = 24, color = "#FFCE6A" }) => (
    <Svg width={size} height={size} viewBox="0 0 48 48" fill="none">
        <Path d="M22 38V17M25 17V28.5" stroke={color} strokeWidth="2.5" strokeLinecap="round" />
        <Path d="M25 34.5V37.5" stroke={color} strokeWidth="2.5" strokeLinecap="round" />
        <Path d="M28 11C31.9668 9.04906 34.2277 9.4442 37.7623 11.8407C38.5516 12.3759 39 13.2822 39 14.2358V20.2193M39 20.2193L36.5 23.2193M39 20.2193L41.5 23.2193" stroke={color} strokeWidth="2.5" strokeLinecap="round" />
        <Path d="M39.1538 30.2193H38.8462C36.722 30.2193 35 28.4973 35 26.3731C35 25.7359 35.5166 25.2193 36.1538 25.2193H41.8462C42.4834 25.2193 43 25.7359 43 26.3731C43 28.4973 41.278 30.2193 39.1538 30.2193Z" stroke={color} strokeWidth="2.5" strokeLinecap="round" />
        <Path d="M19 11C17.3255 10.1764 16.4447 10.0937 15.0516 10.0129" stroke={color} strokeWidth="2.5" strokeLinecap="round" />
        <Path d="M9 12C8.46493 12.5351 8 13.208 8 13.9647V20.2193M8 20.2193L10.5 23.2193M8 20.2193L5.5 23.2193" stroke={color} strokeWidth="2.5" strokeLinecap="round" />
        <Path d="M7.84615 30.2193H8.15385C10.278 30.2193 12 28.4973 12 26.3731C12 25.7359 11.4834 25.2193 10.8462 25.2193H5.15385C4.51659 25.2193 4 25.7359 4 26.3731C4 28.4973 5.72198 30.2193 7.84615 30.2193Z" stroke={color} strokeWidth="2.5" strokeLinecap="round" />
        <Path d="M30.7961 41L16.2039 41C15.7426 41 15.2893 41.1204 14.8888 41.3493C14.1021 41.7988 14.4211 43 15.3272 43H31.6728C32.5789 43 32.8979 41.7988 32.1112 41.3493C31.7107 41.1204 31.2574 41 30.7961 41Z" stroke={color} strokeWidth="2.5" strokeLinecap="round" />
        <Circle cx="23.5" cy="12.5" r="1.73949" transform="rotate(-0.398988 23.5 12.5)" stroke={color} strokeWidth="2.5" />
    </Svg>
);

export const DirtyCashIcon = ({ size = 24, color = "#FFCE6A" }) => (
    <Svg width={size} height={size} viewBox="0 0 48 48" fill="none">
        <Path d="M28 32H39C40.6569 32 42 30.6569 42 29V16C42 14.3431 40.6569 13 39 13H28" stroke={color} strokeWidth="2.5" strokeLinecap="round" />
        <Path d="M17 32H6C4.34315 32 3 30.6569 3 29V16C3 14.3431 4.34315 13 6 13H6.5" stroke={color} strokeWidth="2.5" strokeLinecap="round" />
        <Path d="M13 13H17" stroke={color} strokeWidth="2.5" strokeLinecap="round" />
        <Path d="M44 17C44.6403 17.6403 45 18.5087 45 19.4142V20V30C45 32.7614 42.7614 35 40 35" stroke={color} strokeWidth="2.5" strokeLinecap="round" />
        <Path d="M34 35H27.5" stroke={color} strokeWidth="2.5" strokeLinecap="round" />
        <Path d="M17.5 35H10.5H9.41421C8.50871 35 7.64029 34.6403 7 34" stroke={color} strokeWidth="2.5" strokeLinecap="round" />
        <Path d="M20 33.5V13.5C20 12.1193 21.1193 11 22.5 11C23.8807 11 25 12.1193 25 13.5V33.5C25 34.8807 23.8807 36 22.5 36C21.1193 36 20 34.8807 20 33.5Z" stroke={color} strokeWidth="2.5" strokeLinecap="round" />
        <Circle cx="8.5" cy="22.5" r="1.75" stroke={color} strokeWidth="2.5" />
        <Circle cx="36.5" cy="22.5" r="1.75" stroke={color} strokeWidth="2.5" />
        <Path d="M27 28C28.2231 26.8006 29 25.0058 29 23C29 20.9942 28.2231 19.1994 27 18" stroke={color} strokeWidth="2.5" strokeLinecap="round" />
        <Path d="M18 28C16.7769 26.8006 16 25.0058 16 23C16 20.9942 16.7769 19.1994 18 18" stroke={color} strokeWidth="2.5" strokeLinecap="round" />
    </Svg>
);
// [NEW] Halo Icon for Angel Frame
export const HaloIcon = ({ size = 24, color = "#FFCE6A" }) => (
    <Svg width={size} height={size} viewBox="0 0 48 48" fill="none">
        <Ellipse cx="24" cy="24" rx="20" ry="6" stroke={color} strokeWidth="3" />
        <Ellipse cx="24" cy="24" rx="20" ry="6" stroke="white" strokeWidth="1" opacity="0.5" />
    </Svg>
);

// [RE-DESIGNED] Horns Icon for Demon Frame (from corna.svg)
// [RE-DESIGNED] Horns Icon for Demon Frame (from corna.svg)
export const HornsIcon = ({ size = 24, color = "#ef4444" }) => (
    <Svg width={size * 1.5} height={size} viewBox="-8 0 64 48" fill="none">
        <Path transform="translate(-8, 0)" d="M5.55869 36.0741C6.47227 37.3556 7.58561 38.5644 8.90589 39.6938C9.10867 39.8673 9.41208 39.8436 9.5939 39.6482C12.0039 37.0589 13.9626 35.8541 17.3046 35.2902C17.8428 35.1994 17.9428 34.3474 17.4384 34.1387C9.22369 30.739 6.60173 25.1015 8.02762 10.2884C8.07907 9.75395 7.38024 9.51425 7.12 9.98392C3.1515 17.146 1.54313 23.778 2.69939 29.5" stroke={color} strokeWidth="2.5" strokeLinecap="round" />
        <Path transform="translate(4, 0)" d="M41.071 15C41.0157 13.5391 40.9056 11.9691 40.7429 10.2799C40.6914 9.74544 41.3922 9.51624 41.6524 9.98592C48.2878 21.9623 48.3236 32.4563 39.8681 39.6915C39.6653 39.865 39.3592 39.8436 39.1774 39.6482C36.7674 37.0589 34.8087 35.8541 31.4667 35.2902C30.9285 35.1994 30.8266 34.3482 31.3309 34.1395C37.2384 31.6952 40.2541 28.0942 40.9525 20.757" stroke={color} strokeWidth="2.5" strokeLinecap="round" />
    </Svg>
);

// [NEW] Heart Icon for Love Frame
export const HeartIcon = ({ size = 24, color = "#f472b6" }) => (
    <Svg width={size} height={size} viewBox="0 0 48 48" fill={color}>
        <Path d="M34 9C31 9 28 11 24 15C20 11 17 9 14 9C9 9 5 13 5 18C5 28 16 35 24 41C32 35 43 28 43 18C43 13 39 9 34 9Z" stroke="none" />
        <Path d="M34 9C31 9 28 11 24 15C20 11 17 9 14 9C9 9 5 13 5 18C5 28 16 35 24 41C32 35 43 28 43 18C43 13 39 9 34 9Z" stroke="rgba(0,0,0,0.2)" strokeWidth="2" fill="none" />
    </Svg>
);

// [RE-DESIGNED] Money Icon for Rich Frame
export const MoneyIcon = ({ size = 24, color = "#10b981" }) => (
    <Svg width={size} height={size} viewBox="0 0 48 48" fill="none">
        <Circle cx="24" cy="24" r="18" stroke={color} strokeWidth="2.5" fill="#064e3b" fillOpacity="0.4" />
        {/* Proper Dollar Sign $ */}
        <Path
            d="M24 10V38M31 16C31 16 30 14 24 14C18 14 17 18 20 21C23 24 31 25 31 30C31 35 25 35 24 35C23 35 17 34 17 34M17 31V33"
            stroke={color}
            strokeWidth="3.5"
            strokeLinecap="round"
            strokeLinejoin="round"
        />
    </Svg>
);

// [NEW] Thorns Icon for Dark/Thorn Frames
export const ThornsIcon = ({ size = 24, color = "#666" }) => (
    <Svg width={size} height={size} viewBox="0 0 48 48" fill="none">
        <Path d="M24 10V38M10 24H38M14 14L34 34M34 14L14 34" stroke={color} strokeWidth="2.5" strokeLinecap="round" />
        <Path d="M20 18L24 22L28 18M18 20L22 24L18 28M30 20L26 24L30 28M20 30L24 26L28 30" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </Svg>
);
// [NEW] Shield Icon for Protection/Success
export const ShieldIcon = ({ size = 24, color = "#4ade80" }) => (
    <Svg width={size} height={size} viewBox="0 0 48 48" fill="none">
        <Path d="M12 36C8.33429 30.5349 6.5391 23.2734 6.87607 13.5933C6.9249 12.1908 7.98726 11.0472 9.374 10.8318C14.211 10.0807 17.4495 9.3351 21.4033 5.27477C22.2712 4.3835 23.7288 4.38342 24.5943 5.27709C28.5226 9.33362 31.66 10.0802 36.4662 10.8309C37.8527 11.0474 38.9135 12.1887 38.9741 13.5908C38.9948 14.0683 39.0112 14.5379 39.0233 15" stroke={color} strokeWidth="2.5" strokeLinecap="round" />
        <Path d="M39.0233 21C38.0351 31.0631 33.6377 37.9026 24.7354 44.7131C23.7109 45.4969 22.2907 45.4964 21.2609 44.7196C19.372 43.2947 17.6903 41.9037 16.2033 40.5" stroke={color} strokeWidth="2.5" strokeLinecap="round" />
        <Path d="M18 25L21.7027 27.8799C22.1418 28.2214 22.775 28.139 23.1121 27.6966L30.5 18" stroke={color} strokeWidth="2.5" strokeLinecap="round" />
    </Svg>
);

export const CheckIcon = ({ size = 24, color = "#4ade80" }) => (
    <Svg width={size} height={size} viewBox="0 0 48 48" fill="none">
        <Path d="M2 30L8.5 35.0388" stroke={color} strokeWidth="2.5" strokeLinecap="round" />
        <Path d="M14.5 39.6899L15.0929 40.1496C16.4087 41.1695 18.3033 40.9231 19.3143 39.6005L45 6" stroke={color} strokeWidth="2.5" strokeLinecap="round" />
    </Svg>
);

export const CrossIcon = ({ size = 24, color = "#FF453A" }) => (
    <Svg width={size} height={size} viewBox="0 0 48 48" fill="none">
        <Path d="M7 7L9 9" stroke={color} strokeWidth="2.5" strokeLinecap="round" />
        <Path d="M13 13L24 24" stroke={color} strokeWidth="2.5" strokeLinecap="round" />
        <Path d="M26 26L27 27" stroke={color} strokeWidth="2.5" strokeLinecap="round" />
        <Path d="M30 30L41 41" stroke={color} strokeWidth="2.5" strokeLinecap="round" />
        <Path d="M41 7L26 22" stroke={color} strokeWidth="2.5" strokeLinecap="round" />
        <Path d="M24 24L7 41" stroke={color} strokeWidth="2.5" strokeLinecap="round" />
    </Svg>
);


// [NEW] Cat Ears Icon for Cat Frame
export const CatIcon = ({ size = 24, color = "#f472b6" }) => (
    <Svg width={size} height={size * 0.8} viewBox="0 0 60 48" fill="none">
        <Path d="M2.56491 26C2.23839 21.7871 2.42175 17.325 3.22378 14.0133C3.35833 13.4577 3.95105 13.1613 4.47896 13.3807C9.42429 15.4356 16.0442 20.1182 20.5 27" stroke={color} strokeWidth="2.5" strokeLinecap="round" />
        <Path d="M3.43308 32C3.72983 33.3166 4.08723 34.506 4.5 35.5" stroke={color} strokeWidth="2.5" strokeLinecap="round" />
        <Path d="M6 17C9.5 21.5 10.5 22.5 14 29.5" stroke={color} strokeWidth="2.5" strokeLinecap="round" />
        <Path d="M39 27C39.5624 26.1313 40.1594 25.2977 40.783 24.5" stroke={color} strokeWidth="2.5" strokeLinecap="round" />
        <Path d="M45 19.9525C48.384 16.8535 52.0126 14.6307 55.0214 13.3805C55.5493 13.1612 56.1411 13.4558 56.2757 14.0114C57.7754 20.2008 57.1133 30.4107 55 35.5" stroke={color} strokeWidth="2.5" strokeLinecap="round" />
        <Path d="M53.5 17C50 21.5 49 22.5 45.5 29.5" stroke={color} strokeWidth="2.5" strokeLinecap="round" />
    </Svg>
);

// [NEW] Back Arrow Icon
export const ArrowLeftIcon = ({ size = 24, color = "#FFCE6A" }) => (
    <Svg width={size} height={size} viewBox="0 0 48 48" fill="none">
        <Path d="M31 36L19 24L31 12" stroke={color} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
);

export const HomeIcon = ({ size = 24, color = "#FFCE6A" }) => (
    <Svg width={size} height={size} viewBox="0 0 48 48" fill="none">
        <Path d="M9 18V42H39V18L24 6L9 18Z" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        <Path d="M19 29V42H29V29H19Z" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        <Path d="M9 42H39" stroke={color} strokeWidth="2.5" strokeLinecap="round" />
    </Svg>
);

export const ShopIcon = ({ size = 24, color = "#FFCE6A" }) => (
    <Svg width={size} height={size} viewBox="0 0 48 48" fill="none">
        <Path d="M39 32H13L8 12H44L39 32Z" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        <Path d="M3 6H8" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        <Circle cx="13" cy="39" r="3" stroke={color} strokeWidth="2.5" />
        <Circle cx="39" cy="39" r="3" stroke={color} strokeWidth="2.5" />
    </Svg>
);

export const WalletIcon = ({ size = 24, color = "#FFCE6A" }) => (
    <Svg width={size} height={size} viewBox="0 0 48 48" fill="none">
        <Path d="M4 10C4 8.89543 4.89543 8 6 8H42C43.1046 8 44 8.89543 44 10V14H4V10Z" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        <Path d="M4 14V38C4 39.1046 4.89543 40 6 40H42C43.1046 40 44 39.1046 44 38V14H4Z" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        <Path d="M34 27H44" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        <Circle cx="34" cy="27" r="3" fill={color} />
    </Svg>
);

export const ShirtIcon = ({ size = 24, color = "#FFCE6A" }) => (
    <Svg width={size} height={size} viewBox="0 0 48 48" fill="none">
        <Path d="M36.1904 15H11.8096C11.129 15 10.4939 15.346 10.0963 15.9184L6 21.8125V39C6 40.1046 6.89543 41 8 41H40C41.1046 41 42 40.1046 42 39V21.8125L37.9037 15.9184C37.5061 15.346 36.871 15 36.1904 15Z" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        <Path d="M24 15V8L32 10" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        <Path d="M24 15V8L16 10" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
);

export const PlayIcon = ({ size = 24, color = "#FFCE6A" }) => (
    <Svg width={size} height={size} viewBox="0 0 48 48" fill="none">
        <Path d="M13.8141 38.4009L11.4068 39.6758C9.40876 40.734 7.0027 39.2856 7.0027 37.0247V10.9765C7.0027 8.71527 9.40926 7.2669 11.4073 8.32559L35.9983 21.3556C38.1247 22.4823 38.1257 25.5283 36 26.6564L20.0593 35.116" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
    </Svg>
);

export const ShareIcon = ({ size = 24, color = "#FFCE6A" }) => (
    <Svg width={size} height={size} viewBox="0 0 48 48" fill="none">
        <Path d="M28 6H42V20" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        <Path d="M42 29.4737V39C42 40.6569 40.6569 42 39 42H9C7.34315 42 6 40.6569 6 39V9C6 7.34315 7.34315 6 9 6L18.5263 6" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        <Path d="M25.8 22.2L41.1 6.9" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
);

export const GithubIcon = ({ size = 24, color = "#FFCE6A" }) => (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <Path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"></Path>
    </Svg>
);
