import Helper from "@core/helper";
import {Step} from "@core/base.page";
import {DBNames} from "@enums/common.enum";

type ProductUserMappingRow = {
    id: number;
    productid: number;
    userid: number;
};

export default class CreditCardDb {
    @Step("Get all product mappings by userId")
    static async getProductsByUserId(userId: number) {
        const db = Helper.createDbClient(DBNames.CREDIT_CARD_DB);
        await db.connect();

        try {
            const res = await db.query<ProductUserMappingRow>(
                `
                    SELECT id, productid, userid
                    FROM public.productusermappings
                    WHERE userid = $1
                `,
                [userId]
            );

            console.log(`User(${userId}) için ${res.rows.length} kayıt bulundu.`);
            res.rows.forEach(row =>
                console.log(`ID: ${row.id} | ProductID: ${row.productid} | UserID: ${row.userid}`)
            );

            return res.rows;
        } finally {
            await db.end();
        }
    }

    @Step("Get all user mappings by productId")
    static async getUsersByProductId(productId: number) {
        const db = Helper.createDbClient(DBNames.CREDIT_CARD_DB);
        await db.connect();

        try {
            const res = await db.query<ProductUserMappingRow>(
                `
                    SELECT id, productid, userid
                    FROM public.productusermappings
                    WHERE productid = $1
                    ORDER BY id DESC
                `,
                [productId]
            );

            console.log(`Product(${productId}) için ${res.rows.length} kullanıcı bulundu.`);
            res.rows.forEach(row =>
                console.log(`ID: ${row.id} | ProductID: ${row.productid} | UserID: ${row.userid}`)
            );

            return res.rows;
        } finally {
            await db.end();
        }
    }

}
