import { Request, Response } from "express";
import {
  fetchEvents,
  filterEvents,
  fetchOdds,
  convertEventsToUI,
} from "../utils/utils";
import { GatewayData, UI } from "../contracts/contracts";

class Gateway {
  constructor() {}

  handleGateway = async (req: Request, res: Response): Promise<void> => {
    const { method } = req.params;
    if (method != "all" && method != "query") {
      res.status(404);
      return;
    }
    const data: GatewayData = req.body;
    if (!data || !data.search.length) {
      res.status(400).json({ message: "body or search item not provided" });
      return;
    }
    switch (method) {
      case "all":
        break;

      case "query":
        const output = await query(data.search);
        res.status(200).json(output);
        break;
    }
  };
}

const query = async (search: string): Promise<UI[][]> => {
  try {
    const matches = await fetchEvents(search);
    const filtered = filterEvents(matches);
    const odds = await fetchOdds(filtered);
    const uiEvents = convertEventsToUI(odds);
    return uiEvents;
  } catch {
    return [];
  }
};

export const gateway = new Gateway();
