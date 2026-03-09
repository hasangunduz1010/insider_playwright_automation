import Helper from "@core/helper";
import {Step} from "@core/base.page";
import {DBNames} from "@enums/common.enum";

type OtpRow = {
    Code: string;
    PhoneNumber: string;
    CreatedDate: string;
    ExpireDate: string;
    IsVerified: boolean;
    SourceType: string;
};

export default class IdentityServerDb {
    private static normalizeLast10(phone: string) {
        return phone.replace(/\D/g, "").slice(-10);
    }

    @Step("Get ACTIVE (unverified & not expired) OTP Code For")
    static async getActiveOtpCodeWithSourceType(
        phoneNumber: string,
        sourceType: string = "signin",
        timeoutMs = 8000
    ) {
        //Eğer sourceType boş/undefined/null ise fallback yap
        if (!sourceType || sourceType.trim() === "") {
            return await this.getActiveOtpCodeFor(phoneNumber, timeoutMs);
        }

        const last10 = this.normalizeLast10(phoneNumber);
        const db = Helper.createDbClient(DBNames.IDENTITY_SERVER_DB);
        await db.connect();

        const deadline = Date.now() + timeoutMs;
        try {
            while (Date.now() < deadline) {
                const res = await db.query<OtpRow>(
                    `
                        SELECT "Code", "PhoneNumber", "CreatedDate", "ExpireDate", "IsVerified", "SourceType"
                        FROM public."Otp"
                        WHERE
                            regexp_replace(regexp_replace(regexp_replace("PhoneNumber", '\\D', '', 'g'), '^(90|0)', ''),
                                           '^', '') LIKE $1
                          AND "SourceType" = $2
                          AND "IsVerified" = false
                          AND "ExpireDate" > NOW()
                        ORDER BY "CreatedDate" DESC LIMIT 1
                    `,
                    [`%${last10}%`, sourceType]
                );

                if (res.rows.length) {
                    const row = res.rows[0];
                    console.log(
                        `OTP ➜ Phone:${row.PhoneNumber} Created:${row.CreatedDate} Expires:${row.ExpireDate} Verified:${row.IsVerified} Source:${row.SourceType}`
                    );
                    return row.Code;
                }

                await new Promise((r) => setTimeout(r, 400));
            }

            throw new Error(
                `Database'de Aktif OTP bulunamadı veya gelmemiş. (son10=${last10}, sourceType=${sourceType}).`
            );
        } finally {
            await db.end();
        }
    }

    @Step("Get ACTIVE (unverified & not expired) OTP Code By Phone (no sourceType)")
    static async getActiveOtpCodeFor(phoneNumber: string, timeoutMs = 8000) {
        const last10 = this.normalizeLast10(phoneNumber);
        const db = Helper.createDbClient(DBNames.IDENTITY_SERVER_DB);
        await db.connect();

        const deadline = Date.now() + timeoutMs;
        try {
            while (Date.now() < deadline) {
                const res = await db.query<OtpRow>(
                    `
                        SELECT "Code", "PhoneNumber", "CreatedDate", "ExpireDate", "IsVerified", "SourceType"
                        FROM public."Otp"
                        WHERE
                            regexp_replace(regexp_replace(regexp_replace("PhoneNumber", '\\D', '', 'g'), '^(90|0)', ''),
                                           '^', '') LIKE $1
                          AND "IsVerified" = false
                          AND "ExpireDate" > NOW()
                        ORDER BY "CreatedDate" DESC LIMIT 1
                    `,
                    [`%${last10}%`]
                );

                if (res.rows.length) {
                    const row = res.rows[0];
                    console.log(
                        `OTP ➜ Phone:${row.PhoneNumber} Created:${row.CreatedDate} Expires:${row.ExpireDate} Verified:${row.IsVerified} Source:${row.SourceType}`
                    );
                    return row.Code;
                }

                await new Promise((r) => setTimeout(r, 400));
            }

            throw new Error(
                `Aktif OTP bulunamadı (son10=${last10}). Muhtemel neden: henüz üretilmedi, expire oldu ya da zaten kullanıldı.`
            );
        } finally {
            await db.end();
        }
    }
}
