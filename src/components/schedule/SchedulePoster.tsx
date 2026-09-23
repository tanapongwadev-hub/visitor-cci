import type { CSSProperties } from "react";
import Image from "next/image";
import { Kanit, Montserrat } from "next/font/google";
import styles from "./schedule.module.css";
import { DEFAULT_SETTINGS, type PosterSettings, type ScheduleData } from "./types";
import FitText from "./FitText";
import {
  CalendarIcon,
  ClockIcon,
  DoorIcon,
  GrowthIcon,
  HandshakeIcon,
  HostIcon,
  PartnershipIcon,
  PeopleIcon,
  VisitorsIcon,
} from "./icons";

const kanit = Kanit({
  subsets: ["thai", "latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-kanit",
  display: "swap",
});

const montserrat = Montserrat({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
  variable: "--font-montserrat",
  display: "swap",
});

const FOOTER_ICONS = [PeopleIcon, PartnershipIcon, GrowthIcon];

type Props = {
  data: ScheduleData;
  settings?: PosterSettings;
  /** ไม่ใส่ padding/min-height ของหน้า — ใช้ตอนฝังเป็น preview */
  compact?: boolean;
  /** โหมด TV: บังคับความสูงโปสเตอร์ (หน่วย px ที่ความกว้าง 1024) และดัน footer ชิดล่าง */
  fillHeight?: number;
  /** โหมดวัดขนาด: ไม่ใช้ min-height เพื่อให้ได้ความสูงจริงของเนื้อหา */
  measure?: boolean;
};

export default function SchedulePoster({
  data,
  settings = DEFAULT_SETTINGS,
  compact = false,
  fillHeight,
  measure = false,
}: Props) {
  const s = settings;
  const t = s.theme;
  // ส่งค่าธีมเป็น CSS variables — สีอื่นๆ derive จาก 5 ค่านี้ใน schedule.module.css
  const themeStyle = {
    "--primary": t.primary,
    "--primary-dark": t.primaryDark,
    "--accent": t.accent,
    "--ink": t.ink,
    "--page-bg": t.pageBg,
    "--font-scale": s.fontScale || 1,
    "--visitor-scale": s.visitorScale || 1,
    "--visitor-weight": s.visitorBold ? 700 : 500,
    "--host-scale": s.hostScale || 1,
    "--host-weight": s.hostBold ? 700 : 500,
    "--room-scale": s.roomScale || 1,
    "--room-weight": s.roomBold ? 700 : 500,
  } as CSSProperties;
  // ให้ FitText วัดขนาดใหม่ทุกครั้งที่ตัวคูณขนาด/น้ำหนักตัวอักษรเปลี่ยน (ไม่งั้น inline font-size ที่ย่อไว้จะค้าง)
  const fitKey = [
    s.fontScale, s.visitorScale, s.visitorBold, s.hostScale, s.hostBold, s.roomScale, s.roomBold, s.hostLayout,
  ].join("|");
  const timeColors = t.timeColors.length ? t.timeColors : DEFAULT_SETTINGS.theme.timeColors;
  const pageClass = [styles.page, kanit.variable, montserrat.variable, compact ? styles.pageCompact : ""]
    .filter(Boolean)
    .join(" ");
  const posterClass = [styles.poster, fillHeight ? styles.posterFill : "", measure ? styles.posterMeasure : ""]
    .filter(Boolean)
    .join(" ");
  const posterStyle = fillHeight ? ({ "--poster-h": `${fillHeight}px` } as CSSProperties) : undefined;
  const isTableLayout = s.hostLayout === "table";
  const host = (row: ScheduleData["rows"][number]) => (
    <>
      <span className={styles.avatar} title="ผู้รับแขก">
        <HostIcon className={styles["svg-icon"]} />
      </span>
      <div className={styles.editable} contentEditable={s.editableHost} suppressContentEditableWarning>
        <strong>
          <FitText fitKey={fitKey}>{row.hostName || s.defaultHostName}</FitText>
        </strong>
        <span>
          <FitText fitKey={fitKey}>{row.hostDept || s.defaultHostDept}</FitText>
        </span>
      </div>
    </>
  );

  return (
    <div className={pageClass} style={themeStyle}>
      <main className={posterClass} style={posterStyle} data-poster>
        <div className={styles["top-wave"]} />

        <header className={styles.header}>
          <Image
            className={styles.logo}
            src="/logo.png"
            alt={`${s.companyNameEn} logo`}
            width={225}
            height={200}
            priority
          />
          {s.showMotto && s.mottoLines.length > 0 ? (
            <div className={styles.motto}>
              {s.mottoLines.map((line, i) => (
                <span key={i}>
                  {i > 0 ? <br /> : null}
                  {line}
                </span>
              ))}
            </div>
          ) : null}
          {s.welcomeText ? <div className={styles.welcome}>{s.welcomeText}</div> : null}
          <h1>{s.companyNameEn}</h1>
          {s.companyNameTh ? <div className={styles["thai-company"]}>{s.companyNameTh}</div> : null}
          <div className={styles["date-line"]}>
            <span className={styles.calendar}>
              <CalendarIcon className={styles["svg-icon"]} />
            </span>
            <span>{data.dateLabel}</span>
          </div>
        </header>

        <section className={isTableLayout ? styles.scheduleTable : styles.schedule}>
          <div className={styles["grid-header"]}>
            <HeaderCell icon={<ClockIcon className={styles["svg-icon"]} />} en="TIME" th="เวลา" />
            <HeaderCell
              icon={<VisitorsIcon className={styles["svg-icon"]} />}
              en="VISITOR"
              th="ผู้มาติดต่อ / กิจกรรม"
            />
            {isTableLayout ? (
              <HeaderCell icon={<HandshakeIcon className={styles["svg-icon"]} />} en="HOST" th="ผู้รับแขก" />
            ) : null}
            <HeaderCell icon={<DoorIcon className={styles["svg-icon"]} />} en="ROOM" th="ห้องประชุม" />
          </div>

          {data.rows.map((row, i) => (
            <div
              key={row.id}
              className={isTableLayout ? styles.rowTable : styles.row}
              data-row
              style={{ "--tc": timeColors[i % timeColors.length] } as CSSProperties}
            >
              {!isTableLayout ? <div className={styles.host}>{host(row)}</div> : null}

              <div className={styles["time-box"]}>
                <FitText fitKey={fitKey} maxLines={1}>{row.time}</FitText>
              </div>

              <div className={styles.visitor}>
                <strong>
                  <FitText fitKey={fitKey}>{row.company}</FitText>
                </strong>
                {row.visitorNames.length > 0 ? (
                  <div className={styles.names}>
                    {row.visitorNames.map((name, j) => (
                      <FitText key={j} fitKey={fitKey}>{name}</FitText>
                    ))}
                  </div>
                ) : null}
                {row.label ? <div className={styles.label}>{row.label}</div> : null}
              </div>

              {isTableLayout ? <div className={styles.hostColumn}>{host(row)}</div> : null}

              <div className={styles.room}>
                <div className={styles["room-badge"]}>
                  <span className={styles["room-icon"]}>
                    <DoorIcon className={styles["svg-icon"]} />
                  </span>
                  <FitText className={styles["room-text"]} fitKey={fitKey}>{row.room}</FitText>
                </div>
              </div>
            </div>
          ))}
        </section>

        <div className={styles.thanks}>
          {s.thanksEn ? <div className={styles["thanks-en"]}>{s.thanksEn}</div> : null}
          {s.thanksTh ? <div className={styles["thanks-th"]}>{s.thanksTh}</div> : null}
        </div>

        <footer className={styles.footer}>
          {s.footerItems.map((item, i) => {
            const Icon = FOOTER_ICONS[i % FOOTER_ICONS.length];
            return (
              <FooterItem key={i} icon={<Icon className={styles["svg-icon"]} />} en={item.en} th={item.th} />
            );
          })}
          {s.editableHost ? (
            <div className={styles["edit-note"]}>คลิกที่ชื่อผู้รับแขกเพื่อแก้ไขได้</div>
          ) : null}
        </footer>
      </main>
    </div>
  );
}

function HeaderCell({ icon, en, th }: { icon: React.ReactNode; en: string; th: string }) {
  return (
    <div>
      <span className={styles["icon-wrap"]}>
        <span className={styles.icon}>{icon}</span>
      </span>
      <span>
        {en}
        <span className={styles["header-small"]}>{th}</span>
      </span>
    </div>
  );
}

function FooterItem({ icon, en, th }: { icon: React.ReactNode; en: string; th: string }) {
  return (
    <div className={styles.fitem}>
      <div className={styles.fi}>{icon}</div>
      <div className={styles.en}>{en}</div>
      <div className={styles.th}>{th}</div>
    </div>
  );
}
