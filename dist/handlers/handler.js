var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { fetchEvents, filterEvents, fetchOdds, convertEventsToUI, } from "../utils/utils";
class Gateway {
    constructor() {
        this.handleGateway = (req, res) => __awaiter(this, void 0, void 0, function* () {
            const { method } = req.params;
            if (method != "all" && method != "query") {
                res.status(404);
                return;
            }
            const data = req.body;
            if (!data || !data.search.length) {
                res.status(400).json({ message: "body or search item not provided" });
                return;
            }
            switch (method) {
                case "all":
                    break;
                case "query":
                    const output = yield query(data.search);
                    res.status(200).json(output);
                    break;
            }
        });
    }
}
const query = (search) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const matches = yield fetchEvents(search);
        const filtered = filterEvents(matches);
        const odds = yield fetchOdds(filtered);
        const uiEvents = convertEventsToUI(odds);
        return uiEvents;
    }
    catch (_a) {
        return [];
    }
});
export const gateway = new Gateway();
