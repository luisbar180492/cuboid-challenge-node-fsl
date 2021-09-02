import { Request, Response } from 'express';
import * as HttpStatus from 'http-status-codes';
import { Id } from 'objection';
import { Cuboid, Bag } from '../models';

export const list = async (req: Request, res: Response): Promise<Response> => {
  const ids = req.query.ids as Id[];
  const cuboids = await Cuboid.query().findByIds(ids).withGraphFetched('bag');

  return res.status(200).json(cuboids);
};

export const get = async (req: Request, res: Response): Promise<Response> => {
  const id: Id = req.params.id;
  const cuboid = await Cuboid.query().findById(id);

  if (!cuboid) {
    return res.sendStatus(HttpStatus.NOT_FOUND);
  }

  return res.status(200).json(cuboid);
}

export const create = async (
  req: Request,
  res: Response
): Promise<Response> => {
  try {
    const { width, height, depth, bagId } = req.body;

    const bag = await Bag.query().findById(bagId).withGraphFetched('cuboids')
    const volumeOfCuboidsOnBag = bag?.cuboids?.reduce((accumulator, cuboid) => accumulator += cuboid.width * cuboid.height * cuboid.depth, 0)
    const volumeCurrentCuboid = width * height * depth
    const totalVolume = volumeOfCuboidsOnBag && volumeOfCuboidsOnBag + volumeCurrentCuboid

    if (bag && totalVolume && totalVolume > bag?.volume)
      return res.status(HttpStatus.UNPROCESSABLE_ENTITY).send({ message: 'Insufficient capacity in bag' })

    const cuboid = await Cuboid.query().insert({
      width,
      height,
      depth,
      bagId,
    });
  
    return res.status(HttpStatus.CREATED).json(cuboid);
  } catch (error) {
    return res.sendStatus(500)
  }
};
