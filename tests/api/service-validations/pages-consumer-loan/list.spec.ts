import {test} from "@core/fixture.base";
import {Device} from "@data/device.data";
import {checkGetMethod} from "@core/base.service";

test.use({epic: 'Pages Partner'})
test.use({feature: 'List'});

[
    {
        story: 'Popular Partner',
        testName: 'valid data: true',
        statusCode: 200,
        params: {
            PopularRedirect: true
        },
        headers: undefined
    },
    ...Device.names().map(device => ({
        story: 'Device',
        testName: `valid data: ${device}`,
        statusCode: 200,
        params: undefined,
        headers: {
            Device: device
        }
    })),
    {
        story: 'SegmentId',
        testName: 'valid data: numeric chars (1234567890)',
        statusCode: 200,
        params: {
            SegmentId: '1234567890'
        },
        headers: undefined
    },
    {
        story: 'SegmentId',
        testName: 'invalid data: non-numeric chars (ABC 2121)',
        statusCode: 400,
        params: {
            SegmentId: 'ABC 2121'
        },
        headers: undefined
    },
].forEach(({story, testName, statusCode, params, headers}) => {
    test.use({story: story});

    test(`${story} -> ${testName}`, async ({request}) => {
        await checkGetMethod(request, '/pages/partner/list', statusCode, params, headers);
    });
});
